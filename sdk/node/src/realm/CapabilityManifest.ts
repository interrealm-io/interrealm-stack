import { ServiceRegistry } from '../service/ServiceRegistry';
import { AgentRegistry } from '../agent/AgentRegistry';

/**
 * Capability manifest representing what a member provides and requires
 */
export interface CapabilityManifest {
  provides: {
    services: ServiceDescriptor[];
    agents: AgentDescriptor[];
    events: EventDescriptor[];
  };
  requires: {
    services: string[];
    events: string[];
  };
}

export interface ServiceDescriptor {
  capability: string;
  name: string;
  description?: string;
  input?: any;
  output?: any;
}

export interface AgentDescriptor {
  capability: string;
  name: string;
  description?: string;
  skills?: string[];
  loopTypes?: string[];
}

export interface EventDescriptor {
  capability: string;
  name: string;
  topic: string;
  description?: string;
}

/**
 * Builds a capability manifest from service and agent registries
 */
export class CapabilityManifestBuilder {
  constructor(
    private serviceRegistry: ServiceRegistry,
    private agentRegistry: AgentRegistry
  ) {}

  /**
   * Build the capability manifest by extracting metadata from registries
   */
  build(): CapabilityManifest {
    const manifest: CapabilityManifest = {
      provides: {
        services: this.buildServiceDescriptors(),
        agents: this.buildAgentDescriptors(),
        events: this.buildEventDescriptors(),
      },
      requires: {
        services: this.extractRequiredServices(),
        events: this.extractRequiredEvents(),
      },
    };

    return manifest;
  }

  /**
   * Extract service descriptors from the service registry
   */
  private buildServiceDescriptors(): ServiceDescriptor[] {
    const services: ServiceDescriptor[] = [];
    const serviceMap = (this.serviceRegistry as any).services as Map<string, any>;

    if (!serviceMap || !(serviceMap instanceof Map)) {
      return services;
    }

    for (const [key, service] of serviceMap.entries()) {
      if (service.metadata) {
        services.push({
          capability: service.metadata.capability,
          name: service.metadata.name,
          description: service.metadata.description,
        });
      }
    }

    return services;
  }

  /**
   * Extract agent descriptors from the agent registry
   */
  private buildAgentDescriptors(): AgentDescriptor[] {
    const agents: AgentDescriptor[] = [];
    const agentMap = (this.agentRegistry as any).agents as Map<string, any>;

    if (!agentMap || !(agentMap instanceof Map)) {
      return agents;
    }

    for (const [key, agent] of agentMap.entries()) {
      if (agent.metadata) {
        agents.push({
          capability: agent.metadata.capability,
          name: agent.metadata.name,
          description: agent.metadata.description,
          skills: agent.metadata.skills,
          loopTypes: agent.metadata.loopTypes,
        });
      }
    }

    return agents;
  }

  /**
   * Extract event descriptors (publishers)
   * TODO: Implement event handler scanning when EventBus is updated
   */
  private buildEventDescriptors(): EventDescriptor[] {
    // For now, return empty array
    // This will be populated when we add @EventPublisher decorator scanning
    return [];
  }

  /**
   * Extract required services from service implementations
   * TODO: Implement @Inject scanning to detect service dependencies
   */
  private extractRequiredServices(): string[] {
    // For now, return empty array
    // This will be populated when we scan for @Inject decorators
    return [];
  }

  /**
   * Extract required events (subscribers)
   * TODO: Implement @EventHandler scanning to detect event subscriptions
   */
  private extractRequiredEvents(): string[] {
    // For now, return empty array
    // This will be populated when we scan for @EventHandler decorators
    return [];
  }

  /**
   * Generate a summary string of the manifest
   */
  static summarize(manifest: CapabilityManifest): string {
    const lines: string[] = [];

    lines.push('Capability Manifest:');
    lines.push(`  Provides:`);
    lines.push(`    Services: ${manifest.provides.services.length}`);
    manifest.provides.services.forEach(s => {
      lines.push(`      - ${s.capability}.${s.name}`);
    });

    lines.push(`    Agents: ${manifest.provides.agents.length}`);
    manifest.provides.agents.forEach(a => {
      lines.push(`      - ${a.capability}.${a.name} (skills: ${a.skills?.join(', ') || 'none'})`);
    });

    lines.push(`    Events: ${manifest.provides.events.length}`);
    manifest.provides.events.forEach(e => {
      lines.push(`      - ${e.capability}.${e.name} (topic: ${e.topic})`);
    });

    lines.push(`  Requires:`);
    lines.push(`    Services: ${manifest.requires.services.length}`);
    manifest.requires.services.forEach(s => {
      lines.push(`      - ${s}`);
    });

    lines.push(`    Events: ${manifest.requires.events.length}`);
    manifest.requires.events.forEach(e => {
      lines.push(`      - ${e}`);
    });

    return lines.join('\n');
  }
}
