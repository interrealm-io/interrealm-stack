/**
 * Realm Types
 * Generated from core/schemas/mesh-config.schema.yaml
 */

export type RealmType = 'root' | 'service' | 'tenant' | 'environment' | 'department';

export type MemberType = 'consumer' | 'provider' | 'agent-runtime' | 'hybrid';

export type AuthType = 'api-key' | 'oauth2' | 'jwt' | 'mtls' | 'saml' | 'custom';

export type MemberStatus = 'online' | 'offline' | 'away';

/**
 * Authentication Configuration Types
 */
export interface ApiKeyAuth {
  apiKey: string;
  keyPrefix?: string;
}

export interface OAuth2Auth {
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
  scopes?: string[];
}

export interface JWTAuth {
  issuer: string;
  audience: string;
  publicKeyUrl?: string;
  publicKey?: string;
  algorithm?: 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512';
}

export interface MTLSAuth {
  clientCertificate: string;
  certificateAuthority?: string;
  allowedSubjects?: string[];
}

export interface SAMLAuth {
  entityId: string;
  ssoUrl: string;
  certificate?: string;
}

export interface CustomAuth {
  handler: string;
  config?: Record<string, unknown>;
}

export type AuthConfig = ApiKeyAuth | OAuth2Auth | JWTAuth | MTLSAuth | SAMLAuth | CustomAuth;

/**
 * Agent Definition
 */
export interface Agent {
  agentName: string;
  participatesIn?: string[];
  skills?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Member Definition
 */
export interface Member {
  id: string;
  name: string;
  memberType?: MemberType;
  contractName?: string;
  contractVersion?: string;
  authType: AuthType;
  authConfig?: AuthConfig;
  agents?: Agent[];
  status?: MemberStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Route Definition
 */
export interface Route {
  routePattern?: string;
  capability: string;
  operation?: string;
  targetRealmId?: string;
  targetMemberId?: string;
  priority?: number;
  active?: boolean;
}

/**
 * Bridge Contract
 */
export interface BridgeContractProvides {
  capability: string;
  providedBy: string;
}

export interface BridgeContractRequires {
  capability: string;
  version?: string;
}

export interface BridgeContract {
  name: string;
  version: string;
  provides: BridgeContractProvides[];
  requires: BridgeContractRequires[];
}

/**
 * Bridge Definition
 */
export type ConnectionType = 'websocket' | 'grpc' | 'http' | 'mqtt' | 'kafka' | 'custom';

export interface Bridge {
  name: string;
  connectionType: ConnectionType;
  remoteGatewayUrl: string;
  bridgeKey: string;
  connectionConfig?: Record<string, unknown>;
  localContract: BridgeContract;
  routeToRealm?: string;
  active?: boolean;
}

/**
 * Realm Definition (Recursive)
 */
export interface Realm {
  realmId: string;
  displayName?: string;
  realmType?: RealmType;
  description?: string;
  contractName?: string;
  contractVersion?: string;
  policies?: string[];
  inheritPolicies?: boolean;
  members?: Member[];
  routes?: Route[];
  bridges?: Bridge[];
  children?: Realm[];
  metadata?: Record<string, unknown>;
}

/**
 * Policy Types
 */
export type PolicyType =
  | 'capability-access'
  | 'rate-limit'
  | 'audit'
  | 'authentication'
  | 'authorization'
  | 'data-governance'
  | 'custom';

export interface Policy {
  name: string;
  description?: string;
  type: PolicyType;
  config?: Record<string, unknown>;
}

/**
 * Mesh Configuration Metadata
 */
export interface MeshMetadata {
  meshId: string;
  version: string;
  description?: string;
  author?: string;
  tags?: string[];
  previousVersion?: string;
  breakingChanges?: string[];
}

/**
 * Load Balancing Configuration
 */
export type LoadBalancingStrategy = 'round-robin' | 'random' | 'least-connections' | 'hash-based';

export interface HealthCheckConfig {
  enabled?: boolean;
  interval?: string;
  timeout?: string;
}

export interface LoadBalancingConfig {
  strategy?: LoadBalancingStrategy;
  healthCheck?: HealthCheckConfig;
}

/**
 * Capability Import
 */
export interface CapabilityImport {
  import: string;
}

/**
 * Mesh Specification
 */
export interface MeshSpec {
  gatewayUrl: string;
  capabilities?: CapabilityImport[];
  policies?: Policy[];
  realms?: Realm[];
  loadBalancing?: LoadBalancingConfig;
}

/**
 * Complete Mesh Configuration
 */
export interface MeshConfiguration {
  apiVersion: 'interrealm.io/v1alpha1';
  kind: 'MeshConfiguration';
  metadata: MeshMetadata;
  spec: MeshSpec;
}
