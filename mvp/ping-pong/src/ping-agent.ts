#!/usr/bin/env tsx
/**
 * Ping Agent - Connects to realm.alpha
 * Uses SDK decorators for automatic registration
 */

import { Realm } from '@interrealm/sdk';
import { config } from 'dotenv';
import 'reflect-metadata';

// Import the agent class to trigger decorator registration
import { PingAgentClass } from './agents/PingAgent';

config();

const SERVER_URL = process.env.NEXUS_SERVER_URL || 'http://localhost:4000';
const GATEWAY_URL = process.env.NEXUS_GATEWAY_URL || 'ws://localhost:4000/gateway';

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║        🔵 Ping Agent - realm.alpha            ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const realm = new Realm({
    realmId: 'realm.alpha',
    memberId: 'realm.alpha/ping-member',
    serverUrl: SERVER_URL,
    gatewayUrl: GATEWAY_URL,
    apiKey: 'alpha-ping-key-12345',
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
  console.log(`  Member: realm.alpha/ping-member`);
  console.log(`  Realm: realm.alpha\n`);

  try {
    // Initialize realm (connects, authenticates, sends handshake)
    await realm.initialize();

    // Create and register the ping agent instance AFTER realm is initialized
    const pingAgent = new PingAgentClass();
    realm.registerAgentInstance(pingAgent);

    // Initialize the agent
    if (pingAgent.onInit) {
      await pingAgent.onInit(realm);
    }

    console.log('\n✅ Ping agent connected and ready!\n');
    console.log('🏓 Starting ping sequence...\n');

    // Start pinging
    await pingAgent.startPinging();

    // Keep alive
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
