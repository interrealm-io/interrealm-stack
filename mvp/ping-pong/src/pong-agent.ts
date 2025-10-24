#!/usr/bin/env tsx
/**
 * Pong Agent - Connects to realm.beta
 * Uses SDK decorators for automatic registration
 */

import { Realm } from '@interrealm/sdk';
import { config } from 'dotenv';
import 'reflect-metadata';

// Import the agent class to trigger decorator registration
import { PongAgentClass } from './agents/PongAgent';

config();

const SERVER_URL = process.env.NEXUS_SERVER_URL || 'http://localhost:4000';
const GATEWAY_URL = process.env.NEXUS_GATEWAY_URL || 'ws://localhost:4000/gateway';

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║        🟢 Pong Agent - realm.beta             ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const realm = new Realm({
    realmId: 'realm.beta',
    memberId: 'realm.beta/pong-member',
    serverUrl: SERVER_URL,
    gatewayUrl: GATEWAY_URL,
    apiKey: 'beta-pong-key-67890',
    contractName: 'ping-pong-test',
    contractVersion: '1.0.0',
    autoDiscovery: false, // We're manually importing agents
    logging: {
      level: 'info',
      pretty: true
    }
  });

  console.log(`Configuration:`);
  console.log(`  Server: ${SERVER_URL}`);
  console.log(`  Gateway: ${GATEWAY_URL}`);
  console.log(`  Member: realm.beta/pong-member`);
  console.log(`  Realm: realm.beta\n`);

  try {
    // Initialize realm (connects, authenticates, sends handshake)
    await realm.initialize();

    // Create and register the pong agent instance AFTER realm is initialized
    const pongAgent = new PongAgentClass();
    realm.registerAgentInstance(pongAgent);

    // Initialize the agent
    if (pongAgent.onInit) {
      await pongAgent.onInit(realm);
    }

    console.log('\n✅ Pong agent connected and ready!\n');
    console.log('👂 Listening for Ping events from other realms...\n');

    // Keep alive - pong agent is purely reactive
    process.stdin.resume();

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async () => {
  console.log('\n\n⚠️  Shutting down...\n');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();
