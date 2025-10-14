#!/usr/bin/env ts-node
/**
 * Seed script to create a test realm with two members for ping-pong testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test realm for ping-pong demo...\n');

  const REALM_ID = 'test.ping-pong-realm';
  const PING_API_KEY = 'test-ping-key-12345';
  const PONG_API_KEY = 'test-pong-key-67890';

  try {
    // Create test realm (upsert handles existing)
    const realm = await prisma.realm.upsert({
      where: { realmId: REALM_ID },
      update: {
        displayName: 'Ping-Pong Test Realm',
        description: 'Test realm for ping-pong agent protocol demo',
      },
      create: {
        realmId: REALM_ID,
        displayName: 'Ping-Pong Test Realm',
        realmType: 'service',
        description: 'Test realm for ping-pong agent protocol demo',
        contractName: 'ping-pong-test',
        contractVersion: '1.0.0',
      }
    });

    console.log(`✅ Realm ready: ${realm.realmId}`);

    // Create ping member (upsert handles existing)
    const pingMember = await prisma.member.upsert({
      where: { id: `${REALM_ID}/ping-member` },
      update: {
        name: 'Ping Member',
        authConfig: {
          apiKey: PING_API_KEY
        }
      },
      create: {
        id: `${REALM_ID}/ping-member`,
        name: 'Ping Member',
        realmId: realm.id,
        memberType: 'hybrid',
        contractName: 'ping-pong-test',
        contractVersion: '1.0.0',
        authType: 'api-key',
        authConfig: {
          apiKey: PING_API_KEY
        }
      }
    });

    console.log(`✅ Ping member ready: ${pingMember.id}`);
    console.log(`   API Key: ${PING_API_KEY}\n`);

    // Create pong member (upsert handles existing)
    const pongMember = await prisma.member.upsert({
      where: { id: `${REALM_ID}/pong-member` },
      update: {
        name: 'Pong Member',
        authConfig: {
          apiKey: PONG_API_KEY
        }
      },
      create: {
        id: `${REALM_ID}/pong-member`,
        name: 'Pong Member',
        realmId: realm.id,
        memberType: 'hybrid',
        contractName: 'ping-pong-test',
        contractVersion: '1.0.0',
        authType: 'api-key',
        authConfig: {
          apiKey: PONG_API_KEY
        }
      }
    });

    console.log(`✅ Pong member ready: ${pongMember.id}`);
    console.log(`   API Key: ${PONG_API_KEY}\n`);

    console.log('🎉 Seeding complete! Realm and members are ready.\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
