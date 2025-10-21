import { Realm } from '@interrealm/sdk';
import { PingAgent } from '../agents/ping-agent';
import { PongAgent } from '../agents/pong-agent';

interface AgentConfig {
  endpoint: string;
  pingApiKey: string;
  pongApiKey: string;
  realmId?: string;
}

interface RunningAgent {
  realm: Realm;
  agents: any[];
  config: AgentConfig;
}

class AgentManager {
  private runningAgents: Map<string, RunningAgent> = new Map();

  async startPingPongAgents(config: AgentConfig): Promise<void> {
    if (this.runningAgents.has('ping-pong')) {
      throw new Error('Ping-Pong agents are already running');
    }

    try {
      // Use provided realm ID or fail if not provided
      if (!config.realmId) {
        throw new Error('realmId is required in config');
      }
      const realmId = config.realmId;

      // Create Ping Agent Realm
      const pingRealm = new Realm({
        realmId,
        memberId: `${realmId}/ping-agent`,
        serverUrl: config.endpoint.replace('/gateway', '').replace('ws://', 'http://').replace('wss://', 'https://'),
        gatewayUrl: config.endpoint,
        apiKey: config.pingApiKey,
        contractName: 'test.ping-pong',
        contractVersion: '1.0.0',
        autoDiscovery: false,
      });

      // Create Pong Agent Realm
      const pongRealm = new Realm({
        realmId,
        memberId: `${realmId}/pong-agent`,
        serverUrl: config.endpoint.replace('/gateway', '').replace('ws://', 'http://').replace('wss://', 'https://'),
        gatewayUrl: config.endpoint,
        apiKey: config.pongApiKey,
        contractName: 'test.ping-pong',
        contractVersion: '1.0.0',
        autoDiscovery: false,
      });

      // Instantiate agents
      const pingAgent = new PingAgent();
      const pongAgent = new PongAgent();

      // Initialize ping realm and agent
      await pingRealm.initialize();
      await pingAgent.onInit(pingRealm);

      // Initialize pong realm and agent
      await pongRealm.initialize();
      await pongAgent.onInit(pongRealm);

      // Store running agents
      this.runningAgents.set('ping-pong', {
        realm: pingRealm, // Store first realm as primary
        agents: [
          { realm: pingRealm, agent: pingAgent },
          { realm: pongRealm, agent: pongAgent },
        ],
        config,
      });

      // Start pinging
      await pingAgent.startPinging();

      console.log('Ping-Pong agents started successfully');
    } catch (error) {
      console.error('Failed to start Ping-Pong agents:', error);
      throw error;
    }
  }

  async stopAgent(agentId: string): Promise<void> {
    const runningAgent = this.runningAgents.get(agentId);
    if (!runningAgent) {
      throw new Error(`Agent ${agentId} is not running`);
    }

    try {
      // Shutdown all realms
      for (const { realm } of runningAgent.agents) {
        await realm.shutdown();
      }

      this.runningAgents.delete(agentId);
      console.log(`Agent ${agentId} stopped successfully`);
    } catch (error) {
      console.error(`Failed to stop agent ${agentId}:`, error);
      throw error;
    }
  }

  isAgentRunning(agentId: string): boolean {
    return this.runningAgents.has(agentId);
  }
}

export const agentManager = new AgentManager();
