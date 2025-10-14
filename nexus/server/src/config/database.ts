import { Pool, PoolConfig } from 'pg';
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
  await pool.end();
  logger.info('Database connection pool closed');
}
