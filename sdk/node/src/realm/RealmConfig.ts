export interface RealmConfig {
  /** Unique realm identifier (e.g., "myorg.production") */
  realmId: string;

  /** Member identifier (e.g., "myorg.production/my-service") */
  memberId: string;

  /** Nexus server URL for REST API (e.g., "http://localhost:3001") */
  serverUrl: string;

  /** WebSocket gateway URL (e.g., "ws://localhost:3001/gateway") */
  gatewayUrl: string;

  /** Member API key for authentication */
  apiKey: string;

  /** Contract name for this member (e.g., "order-service") */
  contractName?: string;

  /** Contract version for this member (e.g., "1.0.0") */
  contractVersion?: string;

  /** Directory to scan for annotated components */
  componentPaths?: string[];

  /** Enable auto-discovery of services/agents */
  autoDiscovery?: boolean;

  /** Logging configuration */
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    pretty?: boolean;
  };

  /** Connection retry configuration */
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };

  /** Authentication timeout in milliseconds */
  authTimeout?: number;

  /** WebSocket connection timeout in milliseconds */
  connectionTimeout?: number;
}

/**
 * @deprecated Use RealmConfig with memberId and apiKey instead
 * Legacy configuration for backward compatibility with MVP1
 */
export interface LegacyRealmConfig {
  /** Unique realm identifier */
  realmId: string;

  /** Routing URL for this realm's gateway */
  routingUrl: string;

  /** Optional authentication token */
  authToken?: string;

  /** Capabilities this realm provides */
  capabilities?: string[];

  /** Directory to scan for annotated components */
  componentPaths?: string[];

  /** Enable auto-discovery of services/agents */
  autoDiscovery?: boolean;

  /** Logging configuration */
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    pretty?: boolean;
  };

  /** Connection retry configuration */
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
}