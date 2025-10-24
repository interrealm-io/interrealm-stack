#!/usr/bin/env ts-node
/**
 * Seed script to create cross-realm test environment with policies
 * 
 * This creates:
 * - Root realm with child policy
 * - Two child realms (alpha and beta)
 * - Policies allowing cross-realm communication
 * - Members in each realm for ping-pong testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding cross-realm test environment...\n');

  try {
    // ============================================
    // 1. Create Policies
    // ============================================
    console.log('📋 Creating policies...');

    // Policy 1: Allow all capabilities to/from child realms
    await prisma.policy.upsert({
      where: { name: 'allow-child-realms-all' },
      update: {
        config: {
          rules: [{
            capability: '*',
            operations: ['*'],
            direction: 'bidirectional',
            allowFrom: { childRealms: true },
            allowTo: { childRealms: true }
          }]
        }
      },
      create: {
        name: 'allow-child-realms-all',
        type: 'capability-access',
        description: 'Allow all capabilities bidirectionally to/from direct child realms',
        config: {
          rules: [{
            capability: '*',
            operations: ['*'],
            direction: 'bidirectional',
            allowFrom: { childRealms: true },
            allowTo: { childRealms: true }
          }]
        }
      }
    });

    console.log('  ✓ allow-child-realms-all');

    // Policy 2: Allow ping-pong capability from any realm
    await prisma.policy.upsert({
      where: { name: 'allow-ping-pong-any' },
      update: {
        config: {
          rules: [{
            capability: 'test.ping-pong',
            operations: ['*'],
            direction: 'bidirectional',
            allowFrom: { anyRealm: true },
            allowTo: { anyRealm: true }
          }]
        }
      },
      create: {
        name: 'allow-ping-pong-any',
        type: 'capability-access',
        description: 'Allow ping-pong capability from any realm',
        config: {
          rules: [{
            capability: 'test.ping-pong',
            operations: ['*'],
            direction: 'bidirectional',
            allowFrom: { anyRealm: true },
            allowTo: { anyRealm: true }
          }]
        }
      }
    });

    console.log('  ✓ allow-ping-pong-any');

    // Policy 3: Allow test capabilities between siblings
    await prisma.policy.upsert({
      where: { name: 'allow-test-sibling-realms' },
      update: {
        config: {
          rules: [{
            capability: 'test.*',
            operations: ['*'],
            direction: 'bidirectional',
            allowFrom: {
              realmPatterns: ['realm.*']
            },
            allowTo: {
              realmPatterns: ['realm.*']
            }
          }]
        }
      },
      create: {
        name: 'allow-test-sibling-realms',
        type: 'capability-access',
        description: 'Allow test.* capabilities between sibling realms',
        config: {
          rules: [{
            capability: 'test.*',
            operations: ['*'],
            direction: 'bidirectional',
            allowFrom: {
              realmPatterns: ['realm.*']
            },
            allowTo: {
              realmPatterns: ['realm.*']
            }
          }]
        }
      }
    });

    console.log('  ✓ allow-test-sibling-realms\n');

    // ============================================
    // 2. Create Realm Hierarchy
    // ============================================
    console.log('🌐 Creating realm hierarchy...');

    // Root realm
    const rootRealm = await prisma.realm.upsert({
      where: { realmId: 'realm.root' },
      update: {
        displayName: 'Root Realm',
        policies: ['allow-child-realms-all']
      },
      create: {
        realmId: 'realm.root',
        displayName: 'Root Realm',
        realmType: 'root',
        description: 'Root realm for cross-realm testing',
        policies: ['allow-child-realms-all'],
        inheritPolicies: false
      }
    });

    console.log(`  ✓ ${rootRealm.realmId} (${rootRealm.id})`);

    // Realm Alpha (child of root)
    const realmAlpha = await prisma.realm.upsert({
      where: { realmId: 'realm.alpha' },
      update: {
        displayName: 'Realm Alpha',
        parentId: rootRealm.id,
        policies: ['allow-ping-pong-any', 'allow-test-sibling-realms']
      },
      create: {
        realmId: 'realm.alpha',
        parentId: rootRealm.id,
        displayName: 'Realm Alpha',
        realmType: 'service',
        description: 'Test realm Alpha for ping agent',
        policies: ['allow-ping-pong-any', 'allow-test-sibling-realms'],
        inheritPolicies: true
      }
    });

    console.log(`  ✓ ${realmAlpha.realmId} (${realmAlpha.id})`);
    console.log(`    Parent: ${rootRealm.realmId}`);

    // Realm Beta (child of root)
    const realmBeta = await prisma.realm.upsert({
      where: { realmId: 'realm.beta' },
      update: {
        displayName: 'Realm Beta',
        parentId: rootRealm.id,
        policies: ['allow-ping-pong-any', 'allow-test-sibling-realms']
      },
      create: {
        realmId: 'realm.beta',
        parentId: rootRealm.id,
        displayName: 'Realm Beta',
        realmType: 'service',
        description: 'Test realm Beta for pong agent',
        policies: ['allow-ping-pong-any', 'allow-test-sibling-realms'],
        inheritPolicies: true
      }
    });

    console.log(`  ✓ ${realmBeta.realmId} (${realmBeta.id})`);
    console.log(`    Parent: ${rootRealm.realmId}\n`);

    // ============================================
    // 3. Create Members
    // ============================================
    console.log('👥 Creating members...');

    const ALPHA_PING_KEY = 'alpha-ping-key-12345';
    const BETA_PONG_KEY = 'beta-pong-key-67890';

    // Ping member in Realm Alpha
    const pingMember = await prisma.member.upsert({
      where: { id: 'realm.alpha/ping-member' },
      update: {
        name: 'Ping Member (Realm Alpha)',
        realmId: realmAlpha.id,
        authConfig: {
          apiKey: ALPHA_PING_KEY
        }
      },
      create: {
        id: 'realm.alpha/ping-member',
        name: 'Ping Member (Realm Alpha)',
        realmId: realmAlpha.id,
        memberType: 'hybrid',
        contractName: 'ping-pong-test',
        contractVersion: '1.0.0',
        authType: 'api-key',
        authConfig: {
          apiKey: ALPHA_PING_KEY
        },
        scannedContract: {
          provided: [{
            name: 'test.ping-pong',
            version: '1.0.0',
            events: ['Ping']
          }],
          required: ['test.ping-pong'],
          eventHandlers: [{
            capability: 'test.ping-pong',
            eventName: 'Pong',
            topic: 'ping-pong'
          }]
        }
      }
    });

    console.log(`  ✓ ${pingMember.id}`);
    console.log(`    Realm: ${realmAlpha.realmId}`);
    console.log(`    API Key: ${ALPHA_PING_KEY}`);

    // Pong member in Realm Beta
    const pongMember = await prisma.member.upsert({
      where: { id: 'realm.beta/pong-member' },
      update: {
        name: 'Pong Member (Realm Beta)',
        realmId: realmBeta.id,
        authConfig: {
          apiKey: BETA_PONG_KEY
        }
      },
      create: {
        id: 'realm.beta/pong-member',
        name: 'Pong Member (Realm Beta)',
        realmId: realmBeta.id,
        memberType: 'hybrid',
        contractName: 'ping-pong-test',
        contractVersion: '1.0.0',
        authType: 'api-key',
        authConfig: {
          apiKey: BETA_PONG_KEY
        },
        scannedContract: {
          provided: [{
            name: 'test.ping-pong',
            version: '1.0.0',
            events: ['Pong']
          }],
          required: ['test.ping-pong'],
          eventHandlers: [{
            capability: 'test.ping-pong',
            eventName: 'Ping',
            topic: 'ping-pong'
          }]
        }
      }
    });

    console.log(`  ✓ ${pongMember.id}`);
    console.log(`    Realm: ${realmBeta.realmId}`);
    console.log(`    API Key: ${BETA_PONG_KEY}\n`);

    // ============================================
    // Summary
    // ============================================
    console.log('✅ Cross-realm test environment seeded successfully!\n');
    
    console.log('📊 Summary:');
    console.log('═══════════════════════════════════════════════════');
    console.log('Realm Hierarchy:');
    console.log('  realm.root');
    console.log('  ├── realm.alpha (Ping Member)');
    console.log('  └── realm.beta (Pong Member)');
    console.log('');
    console.log('Policies:');
    console.log('  • allow-child-realms-all (on root)');
    console.log('  • allow-ping-pong-any (on alpha, beta)');
    console.log('  • allow-test-sibling-realms (on alpha, beta)');
    console.log('');
    console.log('Members:');
    console.log(`  • Ping: realm.alpha/ping-member`);
    console.log(`    Key: ${ALPHA_PING_KEY}`);
    console.log(`  • Pong: realm.beta/pong-member`);
    console.log(`    Key: ${BETA_PONG_KEY}`);
    console.log('═══════════════════════════════════════════════════\n');

    console.log('🚀 Next Steps:');
    console.log('1. Start the nexus server');
    console.log('2. Connect ping agent:');
    console.log(`   MEMBER_ID=realm.alpha/ping-member API_KEY=${ALPHA_PING_KEY} npm start`);
    console.log('3. Connect pong agent:');
    console.log(`   MEMBER_ID=realm.beta/pong-member API_KEY=${BETA_PONG_KEY} npm start`);
    console.log('4. Watch events flow across realms! 🎉\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
