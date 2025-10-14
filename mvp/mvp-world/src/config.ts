import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface AppConfig {
  realmId: string;
  serverUrl: string;
  gatewayUrl: string;
  pingApiKey: string;
  pongApiKey: string;
  contractName: string;
  contractVersion: string;
  maxPings: number;
  pingInterval: number;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${name}: ${value}`);
  }
  return parsed;
}

export function loadConfig(): AppConfig {
  return {
    realmId: getEnvVar('REALM_ID', 'test.ping-pong-realm'),
    serverUrl: getEnvVar('SERVER_URL', 'http://localhost:3000'),
    gatewayUrl: getEnvVar('GATEWAY_URL', 'ws://localhost:3000/gateway'),
    pingApiKey: getEnvVar('PING_API_KEY'),
    pongApiKey: getEnvVar('PONG_API_KEY'),
    contractName: getEnvVar('CONTRACT_NAME', 'test.ping-pong'),
    contractVersion: getEnvVar('CONTRACT_VERSION', '1.0.0'),
    maxPings: getEnvNumber('MAX_PINGS', 10),
    pingInterval: getEnvNumber('PING_INTERVAL', 1000),
  };
}

export function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  if (!config.realmId) errors.push('realmId is required');
  if (!config.serverUrl) errors.push('serverUrl is required');
  if (!config.gatewayUrl) errors.push('gatewayUrl is required');
  if (!config.pingApiKey) errors.push('pingApiKey is required');
  if (!config.pongApiKey) errors.push('pongApiKey is required');
  if (!config.contractName) errors.push('contractName is required');
  if (!config.contractVersion) errors.push('contractVersion is required');
  if (config.maxPings <= 0) errors.push('maxPings must be greater than 0');
  if (config.pingInterval <= 0) errors.push('pingInterval must be greater than 0');

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}
