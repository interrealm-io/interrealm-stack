#!/usr/bin/env tsx
/**
 * Ping-Pong Test Runner
 *
 * This script demonstrates the basic agent protocol:
 * 1. Two members connect to the same realm
 * 2. They authenticate with API keys and send handshakes
 * 3. Ping agent publishes Ping events
 * 4. Pong agent receives Ping and responds with Pong
 * 5. Ping agent receives Pong and sends next Ping
 */

import { Realm } from '@interrealm/sdk';
import { PingAgent } from './agents/ping-agent';
import { PongAgent } from './agents/pong-agent';

async function main() {
  console.log('🚀 Starting Ping-Pong Test\n');

  // Configuration
  const REALM_ID = 'test.ping-pong-realm';
  const SERVER_URL = 'http://localhost:4000';
  const GATEWAY_URL = 'ws://localhost:4000/gateway';

  // Member 1: Ping Agent
  const pingRealm = new Realm({
    realmId: REALM_ID,
    memberId: `${REALM_ID}/ping-member`,
    serverUrl: SERVER_URL,
    gatewayUrl: GATEWAY_URL,
    apiKey: process.env.PING_API_KEY || 'test-ping-key',
    contractName: 'ping-pong-test',
    contractVersion: '1.0.0',
    autoDiscovery: false, // We'll register manually
    logging: {
      level: 'info',
      pretty: true
    }
  });

  // Member 2: Pong Agent
  const pongRealm = new Realm({
    realmId: REALM_ID,
    memberId: `${REALM_ID}/pong-member`,
    serverUrl: SERVER_URL,
    gatewayUrl: GATEWAY_URL,
    apiKey: process.env.PONG_API_KEY || 'test-pong-key',
    contractName: 'ping-pong-test',
    contractVersion: '1.0.0',
    autoDiscovery: false,
    logging: {
      level: 'info',
      pretty: true
    }
  });

  // Register agents manually
  const pingAgent = new PingAgent();
  const pongAgent = new PongAgent();

  console.log('📝 Registering agents...\n');

  // Initialize agents with their realms
  await pingAgent.onInit(pingRealm);
  await pongAgent.onInit(pongRealm);

  // Register with agent registry
  pingRealm.getAgentRegistry().registerAgentClass(PingAgent, {
    capability: 'test.ping-pong',
    name: 'ping-agent',
    version: '1.0.0'
  });

  pongRealm.getAgentRegistry().registerAgentClass(PongAgent, {
    capability: 'test.ping-pong',
    name: 'pong-agent',
    version: '1.0.0'
  });

  console.log('🔌 Connecting to Nexus...\n');

  try {
    // Initialize both realms (this will connect, authenticate, and handshake)
    await Promise.all([
      pingRealm.initialize(),
      pongRealm.initialize()
    ]);

    console.log('\n✅ Both members connected and ready!\n');
    console.log('🏓 Starting ping-pong sequence...\n');

    // Start pinging
    await pingAgent.startPinging();

    // Keep running for 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log('\n⏹️  Test complete, shutting down...\n');

    await pingRealm.shutdown();
    await pongRealm.shutdown();

    console.log('👋 Goodbye!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during test:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Interrupted, shutting down...\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Terminated, shutting down...\n');
  process.exit(0);
});

main();
