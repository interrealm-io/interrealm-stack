import 'reflect-metadata';
import { getServiceMetadata, ServiceMetadata } from '../decorators/Service';
import { getEventHandlers, EventHandlerMetadata } from '../decorators/EventHandler';

/**
 * TypeScript type analysis utilities
 */
class TypeAnalyzer {
  /**
   * Extract JSON Schema from TypeScript type/interface
   * This is a simplified version - in production, you might use ts-json-schema-generator
   */
  static extractSchemaFromType(type: any): any {
    if (!type) {
      return { type: 'object', properties: {}, additionalProperties: true };
    }

    // For now, return a generic schema
    // In a full implementation, you would use reflection or ts-json-schema-generator
    return {
      type: 'object',
      properties: {},
      additionalProperties: true,
      description: 'Auto-generated from TypeScript type'
    };
  }

  /**
   * Extract domain object name from a TypeScript type
   */
  static extractDomainObjectName(methodName: string, paramIndex: number = 0): string {
    // Simple heuristic: capitalize method name + Request/Response
    const baseName = methodName.charAt(0).toUpperCase() + methodName.slice(1);
    return paramIndex === 0 ? `${baseName}Request` : `${baseName}Response`;
  }
}

/**
 * Scans service classes and event handlers to generate capability contracts
 */
export class ContractScanner {
  private serviceClasses: Map<any, ServiceMetadata> = new Map();
  private eventHandlerClasses: Set<any> = new Set();

  /**
   * Register a service class for scanning
   */
  registerServiceClass(constructor: any, metadata: ServiceMetadata): void {
    this.serviceClasses.set(constructor, metadata);
  }

  /**
   * Register an event handler class for scanning
   */
  registerEventHandlerClass(constructor: any): void {
    this.eventHandlerClasses.add(constructor);
  }

  /**
   * Scan all registered classes and generate a capability contract
   */
  generateContract(contractName: string, contractVersion: string = '1.0.0'): any {
    const capabilities: Map<string, any> = new Map();

    // Scan services
    for (const [constructor, serviceMetadata] of this.serviceClasses.entries()) {
      const capabilityName = serviceMetadata.capability;

      if (!capabilities.has(capabilityName)) {
        capabilities.set(capabilityName, this.createEmptyCapability(capabilityName));
      }

      const capability = capabilities.get(capabilityName);

      // Add service to capability
      const service = this.scanService(constructor, serviceMetadata);
      capability.spec.services.push(service);
    }

    // Scan event handlers
    for (const constructor of this.eventHandlerClasses) {
      const eventHandlers = getEventHandlers(constructor);

      for (const handler of eventHandlers) {
        const capabilityName = handler.capability;

        if (!capabilities.has(capabilityName)) {
          capabilities.set(capabilityName, this.createEmptyCapability(capabilityName));
        }

        const capability = capabilities.get(capabilityName);

        // Add event subscription
        const eventDef = this.scanEventHandler(handler);
        const existingEvent = capability.spec.events.find((e: any) => e.name === eventDef.name);

        if (!existingEvent) {
          capability.spec.events.push(eventDef);
        }
      }
    }

    // Convert capabilities map to array
    const providedCapabilities = Array.from(capabilities.values());

    // Build the contract
    return {
      apiVersion: 'interrealm.io/v1alpha1',
      kind: 'Contract',
      metadata: {
        name: contractName,
        version: contractVersion,
        description: `Auto-generated contract from SDK annotations`,
        generatedAt: new Date().toISOString(),
        generatedBy: 'sdk-contract-scanner',
      },
      spec: {
        provided: providedCapabilities,
        required: [], // This would need to be specified manually or inferred
      }
    };
  }

  /**
   * Create an empty capability structure
   */
  private createEmptyCapability(name: string): any {
    return {
      apiVersion: 'interrealm.io/v1alpha1',
      kind: 'Capability',
      metadata: {
        name,
        version: '1.0.0',
        description: `Auto-generated capability for ${name}`,
      },
      spec: {
        domainObjects: [],
        services: [],
        events: [],
        loops: [],
        loopStacks: [],
      }
    };
  }

  /**
   * Scan a service class and extract service definition
   */
  private scanService(constructor: any, metadata: ServiceMetadata): any {
    // Get method names from the prototype
    const methods = Object.getOwnPropertyNames(constructor.prototype)
      .filter(name => name !== 'constructor' && typeof constructor.prototype[name] === 'function');

    // For now, we'll scan the first method or use the service metadata
    // In a full implementation, you'd want to specify which method is the service handler
    const serviceName = metadata.name || constructor.name;

    // Extract type information from the method signature
    // This is simplified - you'd need more sophisticated type analysis
    const inputDomainObject = TypeAnalyzer.extractDomainObjectName(serviceName, 0);
    const outputDomainObject = TypeAnalyzer.extractDomainObjectName(serviceName, 1);

    return {
      name: serviceName,
      description: `Service: ${serviceName}`,
      timeout: metadata.timeout || 30000,
      retries: metadata.retries || 0,
      idempotent: metadata.idempotent || false,
      input: {
        domainObjectRef: inputDomainObject,
        description: 'Input for ' + serviceName,
      },
      output: {
        domainObjectRef: outputDomainObject,
        description: 'Output for ' + serviceName,
      },
      errors: []
    };
  }

  /**
   * Scan an event handler and extract event definition
   */
  private scanEventHandler(handler: EventHandlerMetadata): any {
    return {
      name: handler.eventName,
      description: `Event: ${handler.eventName}`,
      topic: handler.topic,
      ordering: false,
      payload: {
        inlineSchema: {
          type: 'object',
          description: `Payload for ${handler.eventName}`,
          additionalProperties: true,
        }
      },
      filters: Object.keys(handler.filters || {}).map(field => ({
        field,
        description: `Filter by ${field}`,
      }))
    };
  }

  /**
   * Get a summary of scanned components
   */
  getSummary(): { services: number; eventHandlers: number; capabilities: number } {
    const capabilities = new Set<string>();

    for (const [, metadata] of this.serviceClasses) {
      capabilities.add(metadata.capability);
    }

    for (const constructor of this.eventHandlerClasses) {
      const handlers = getEventHandlers(constructor);
      for (const handler of handlers) {
        capabilities.add(handler.capability);
      }
    }

    return {
      services: this.serviceClasses.size,
      eventHandlers: this.eventHandlerClasses.size,
      capabilities: capabilities.size,
    };
  }
}

// Singleton instance
export const globalContractScanner = new ContractScanner();
