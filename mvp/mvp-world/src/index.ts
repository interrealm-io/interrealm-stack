/**
 * MVP-World: InterRealm SDK Agents
 *
 * Clean TypeScript Node.js implementation without Next.js or webpack.
 * This application demonstrates the ping-pong protocol using two agents
 * connecting to the same realm via WebSocket.
 */

import { Realm } from '@interrealm/sdk';
import { PingAgent } from './agents/ping-agent';
import { PongAgent } from './agents/pong-agent';
import { loadConfig, validateConfig } from './config';

// Global references for cleanup
let pingRealm: Realm | null = null;
let pongRealm: Realm | null = null;
let pingAgent: PingAgent | null = null;
let pongAgent: PongAgent | null = null;

async function main() {
  console.log('\n===========================================');
  console.log('🌐 MVP-World: InterRealm SDK Agents');
  console.log('===========================================\n');

  // Load and validate configuration
  let config;
  try {
    config = loadConfig();
    validateConfig(config);
    console.log('✅ Configuration loaded and validated\n');
  } catch (error) {
    console.error('❌ Configuration error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Realm ID: ${config.realmId}`);
  console.log(`   Server URL: ${config.serverUrl}`);
  console.log(`   Gateway URL: ${config.gatewayUrl}`);
  console.log(`   Contract: ${config.contractName} v${config.contractVersion}`);
  console.log(`   Max Pings: ${config.maxPings}`);
  console.log(`   Ping Interval: ${config.pingInterval}ms\n`);

  try {
    // Create Ping Agent Realm
    console.log('🔧 Creating Ping Agent Realm...');
    pingRealm = new Realm({
      realmId: config.realmId,
      memberId: `${config.realmId}/ping-agent`,
      serverUrl: config.serverUrl,
      gatewayUrl: config.gatewayUrl,
      apiKey: config.pingApiKey,
      contractName: config.contractName,
      contractVersion: config.contractVersion,
      autoDiscovery: false,
    });

    // Create Pong Agent Realm
    console.log('🔧 Creating Pong Agent Realm...');
    pongRealm = new Realm({
      realmId: config.realmId,
      memberId: `${config.realmId}/pong-agent`,
      serverUrl: config.serverUrl,
      gatewayUrl: config.gatewayUrl,
      apiKey: config.pongApiKey,
      contractName: config.contractName,
      contractVersion: config.contractVersion,
      autoDiscovery: false,
    });

    // Instantiate agents
    console.log('🤖 Instantiating agents...\n');
    pingAgent = new PingAgent(config.maxPings, config.pingInterval);
    pongAgent = new PongAgent();

    // Initialize both realms (connect, authenticate, handshake)
    console.log('🔌 Connecting to Nexus...\n');
    await Promise.all([
      pingRealm.initialize(),
      pongRealm.initialize(),
    ]);

    // Initialize agents with their realms (after realm initialization)
    console.log('🔌 Initializing agents with their realms...');
    await pingAgent.onInit(pingRealm);
    await pongAgent.onInit(pongRealm);

    console.log('\n✅ Both agents connected and ready!\n');
    console.log('===========================================');
    console.log('🏓 Starting ping-pong sequence...');
    console.log('===========================================\n');

    // Start pinging
    await pingAgent.startPinging();

    // Keep the process running
    console.log('\n💡 Application is running. Press Ctrl+C to stop.\n');

  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`\n[${timestamp}] ❌ Error during initialization:`, error);

    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    }

    await cleanup();
    process.exit(1);
  }
}

async function cleanup() {
  console.log('\n⏹️  Shutting down...\n');

  try {
    // Stop pinging first
    if (pingAgent) {
      pingAgent.stopPinging();
    }

    // Print stats
    if (pingAgent) {
      const pingStats = pingAgent.getStats();
      console.log(`📊 Ping Agent Stats: ${pingStats.pingCount} pings sent`);
    }
    if (pongAgent) {
      const pongStats = pongAgent.getStats();
      console.log(`📊 Pong Agent Stats: ${pongStats.pongCount} pongs sent`);
    }

    // Shutdown realms
    const shutdownPromises = [];
    if (pingRealm) {
      console.log('🔌 Shutting down Ping Agent Realm...');
      shutdownPromises.push(pingRealm.shutdown());
    }
    if (pongRealm) {
      console.log('🔌 Shutting down Pong Agent Realm...');
      shutdownPromises.push(pongRealm.shutdown());
    }

    await Promise.all(shutdownPromises);

    console.log('\n✅ Cleanup complete\n');
    console.log('👋 Goodbye!\n');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Received SIGINT (Ctrl+C)');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Received SIGTERM');
  await cleanup();
  process.exit(0);
});

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
  cleanup().then(() => process.exit(1));
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:', error);
  cleanup().then(() => process.exit(1));
});

// Start the application
main();
