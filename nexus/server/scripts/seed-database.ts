import { PrismaClient } from '@prisma/client';
import { logger } from '../src/config/logger';

const prisma = new PrismaClient();

async function seed() {
  try {
    logger.info('Starting database seed...');

    // TODO: Add seed data for development/testing

    // Example: Create a root realm
    const rootRealm = await prisma.realm.upsert({
      where: { realmId: 'root' },
      update: {},
      create: {
        realmId: 'root',
        displayName: 'Root Realm',
        realmType: 'root',
        description: 'Root realm for the mesh',
        policies: [],
        metadata: {},
      },
    });

    logger.info('Root realm created/updated:', rootRealm.id);

    // Example: Create sample policies
    await prisma.policy.upsert({
      where: { name: 'default-rate-limit' },
      update: {},
      create: {
        name: 'default-rate-limit',
        description: 'Default rate limiting policy',
        type: 'rate-limit',
        config: {
          requests: 100,
          windowMs: 60000,
        },
      },
    });

    logger.info('Seed completed successfully');
  } catch (error) {
    logger.error('Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    logger.error('Unhandled error during seed:', error);
    process.exit(1);
  });
