import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/realm_mesh',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  },

  // WebSocket
  websocket: {
    port: parseInt(process.env.WS_PORT || '8080', 10),
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '30000', 10),
    pongTimeout: parseInt(process.env.WS_PONG_TIMEOUT || '5000', 10),
  },

  // Auth
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    consoleApiKey: process.env.CONSOLE_API_KEY || 'nexus-console-key-change-in-production',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
} as const;
