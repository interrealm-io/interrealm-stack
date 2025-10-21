import { Pool, PoolConfig } from 'pg';
import { PrismaClient } from '@prisma/client';
import { config } from './environment';
import { logger } from './logger';

const poolConfig: PoolConfig = {
  connectionString: config.database.url,
  max: config.database.maxConnections,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
};

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
  logger.debug('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
});

// Prisma Client instance
export const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Connect Prisma on initialization
prisma.$connect()
  .then(() => logger.info('Prisma Client connected'))
  .catch((err) => logger.error('Prisma Client connection error:', err));

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await Promise.all([
    pool.end(),
    prisma.$disconnect(),
  ]);
  logger.info('Database connections closed');
}
