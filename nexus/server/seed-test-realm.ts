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

  // Create test realm
  const realm = await prisma.realm.upsert({
    where: { realmId: REALM_ID },
    update: {},
    create: {
      realmId: REALM_ID,
      displayName: 'Ping-Pong Test Realm',
      realmType: 'service',
      description: 'Test realm for ping-pong agent protocol demo',
      contractName: 'ping-pong-test',
      contractVersion: '1.0.0',
    }
  });

  console.log(`✅ Realm created: ${realm.realmId}`);

  // Create ping member
  const pingMember = await prisma.member.upsert({
    where: { id: `${REALM_ID}/ping-member` },
    update: {},
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

  console.log(`✅ Member created: ${pingMember.id}`);
  console.log(`   API Key: ${PING_API_KEY}\n`);

  // Create pong member
  const pongMember = await prisma.member.upsert({
    where: { id: `${REALM_ID}/pong-member` },
    update: {},
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

  console.log(`✅ Member created: ${pongMember.id}`);
  console.log(`   API Key: ${PONG_API_KEY}\n`);

  console.log('🎉 Seeding complete!\n');
  console.log('You can now run the ping-pong test with:');
  console.log('  export PING_API_KEY=' + PING_API_KEY);
  console.log('  export PONG_API_KEY=' + PONG_API_KEY);
  console.log('  cd ../../../mvp/test-agents');
  console.log('  npm run test:ping-pong\n');
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
