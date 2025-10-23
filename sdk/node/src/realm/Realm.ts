import { EventEmitter } from 'events';
import { RealmConfig } from './RealmConfig';
import { ComponentScanner } from './ComponentScanner';
import { ServiceRegistry } from '../service/ServiceRegistry';
import { AgentRegistry } from '../agent/AgentRegistry';
import { EventBus } from '../event/EventBus';
import { BridgeManager } from './BridgeManager';

export class Realm extends EventEmitter {
  private config: RealmConfig;
  private serviceRegistry: ServiceRegistry;
  private agentRegistry: AgentRegistry;
  private eventBus: EventBus;
  private bridgeManager: BridgeManager;
  private scanner: ComponentScanner;
  private initialized = false;

  constructor(config: RealmConfig) {
    super();
    this.config = this.validateConfig(config);
    this.serviceRegistry = new ServiceRegistry(this);
    this.agentRegistry = new AgentRegistry(this);
    this.eventBus = new EventBus(this);
    this.bridgeManager = new BridgeManager(this);
    this.scanner = new ComponentScanner(this);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error('Realm already initialized');
    }

    console.log(`Initializing member: ${this.config.memberId}`);
    console.log(`  Realm: ${this.config.realmId}`);
    console.log(`  Contract: ${this.config.contractName}@${this.config.contractVersion || 'latest'}`);

    // 1. Scan for annotated components if auto-discovery enabled
    if (this.config.autoDiscovery) {
      console.log('Step 1: Discovering components...');
      await this.discoverComponents();
    }

    // 2. Register all services
    console.log('Step 2: Registering services...');
    await this.serviceRegistry.registerAll();

    // 3. Register all agents
    console.log('Step 3: Registering agents...');
    await this.agentRegistry.registerAll();

    // 3.5. Generate contract from scanned components
    console.log('Step 3.5: Generating contract from SDK annotations...');
    const generatedContract = this.generateContract();
    if (generatedContract) {
      console.log(`  Generated contract with ${generatedContract.spec.provided.length} capabilities`);
      // Store the generated contract in config for later transmission
      (this.config as any).generatedContract = generatedContract;
    }

    // 4. Connect to the gateway (with auth, capability scanning, and handshake)
    console.log('Step 4: Connecting to Nexus gateway...');
    await this.bridgeManager.connect();

    // 5. Start event bus
    console.log('Step 5: Starting event bus...');
    await this.eventBus.start();

    this.initialized = true;
    this.emit('ready');

    console.log(`✓ Member ${this.config.memberId} is ready`);
  }

  /**
   * Generate a contract from scanned SDK decorators
   */
  private generateContract(): any | null {
    const { globalContractScanner } = require('./ContractScanner');

    const summary = globalContractScanner.getSummary();

    if (summary.services === 0 && summary.eventHandlers === 0) {
      console.log('  No services or event handlers found to generate contract');
      return null;
    }

    const contractName = this.config.contractName || `${this.config.memberId}-contract`;
    const contractVersion = this.config.contractVersion || '1.0.0';

    return globalContractScanner.generateContract(contractName, contractVersion);
  }

  private async discoverComponents(): Promise<void> {
    const paths = this.config.componentPaths || ['./src/**/*.ts'];
    await this.scanner.scan(paths);
  }

  async shutdown(): Promise<void> {
    console.log(`Shutting down realm: ${this.config.realmId}`);

    await this.eventBus.stop();
    await this.bridgeManager.disconnect();

    this.initialized = false;
    this.emit('shutdown');
  }

  /**
   * Register an agent instance and set up its event handlers
   * This is useful when not using autoDiscovery
   */
  registerAgentInstance(agentInstance: any): void {
    const { getEventHandlers } = require('../decorators/EventHandler');
    const handlers = getEventHandlers(agentInstance.constructor);

    for (const handler of handlers) {
      const { capability, eventName, topic, filters, methodName } = handler;

      if (!methodName) continue;

      // Subscribe to the event via EventBus
      this.eventBus.subscribe({
        capability,
        eventName,
        topic,
        filters,
        handler: async (payload: any) => {
          const method = agentInstance[methodName];
          if (typeof method === 'function') {
            await method.call(agentInstance, payload);
          }
        }
      });

      console.log(`Registered event handler: ${capability}.${eventName} on ${topic} -> ${methodName}`);
    }
  }

  getServiceRegistry(): ServiceRegistry { return this.serviceRegistry; }
  getAgentRegistry(): AgentRegistry { return this.agentRegistry; }
  getEventBus(): EventBus { return this.eventBus; }
  getBridgeManager(): BridgeManager { return this.bridgeManager; }
  getConfig(): RealmConfig { return this.config; }

  private validateConfig(config: RealmConfig): RealmConfig {
    if (!config.realmId) throw new Error('realmId is required');
    if (!config.memberId) throw new Error('memberId is required');
    if (!config.serverUrl) throw new Error('serverUrl is required');
    if (!config.gatewayUrl) throw new Error('gatewayUrl is required');
    if (!config.apiKey) throw new Error('apiKey is required');

    return {
      ...config,
      autoDiscovery: config.autoDiscovery ?? true,
      componentPaths: config.componentPaths || ['./src/**/*.ts'],
      logging: config.logging || { level: 'info' },
      retry: config.retry || { maxAttempts: 3, backoffMs: 1000 },
      authTimeout: config.authTimeout || 10000,
      connectionTimeout: config.connectionTimeout || 15000,
    };
  }
}