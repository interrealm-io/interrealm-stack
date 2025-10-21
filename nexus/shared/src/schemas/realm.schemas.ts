/**
 * Zod Validation Schemas for Realm Types
 */

import { z } from 'zod';

/**
 * Enum Schemas
 */
export const RealmTypeSchema = z.enum(['root', 'service', 'tenant', 'environment', 'department']);

export const MemberTypeSchema = z.enum(['consumer', 'provider', 'agent-runtime', 'hybrid']);

export const AuthTypeSchema = z.enum(['api-key', 'oauth2', 'jwt', 'mtls', 'saml', 'custom']);

export const MemberStatusSchema = z.enum(['online', 'offline', 'away']);

export const ConnectionTypeSchema = z.enum(['websocket', 'grpc', 'http', 'mqtt', 'kafka', 'custom']);

export const PolicyTypeSchema = z.enum([
  'capability-access',
  'rate-limit',
  'audit',
  'authentication',
  'authorization',
  'data-governance',
  'custom',
]);

export const LoadBalancingStrategySchema = z.enum([
  'round-robin',
  'random',
  'least-connections',
  'hash-based',
]);

/**
 * Authentication Config Schemas
 */
export const ApiKeyAuthSchema = z.object({
  apiKey: z.string(),
  keyPrefix: z.string().optional(),
});

export const OAuth2AuthSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  tokenEndpoint: z.string().url(),
  scopes: z.array(z.string()).optional(),
});

export const JWTAuthSchema = z.object({
  issuer: z.string(),
  audience: z.string(),
  publicKeyUrl: z.string().url().optional(),
  publicKey: z.string().optional(),
  algorithm: z.enum(['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512']).optional(),
});

export const MTLSAuthSchema = z.object({
  clientCertificate: z.string(),
  certificateAuthority: z.string().optional(),
  allowedSubjects: z.array(z.string()).optional(),
});

export const SAMLAuthSchema = z.object({
  entityId: z.string(),
  ssoUrl: z.string().url(),
  certificate: z.string().optional(),
});

export const CustomAuthSchema = z.object({
  handler: z.string(),
  config: z.record(z.unknown()).optional(),
});

export const AuthConfigSchema = z.union([
  ApiKeyAuthSchema,
  OAuth2AuthSchema,
  JWTAuthSchema,
  MTLSAuthSchema,
  SAMLAuthSchema,
  CustomAuthSchema,
]);

/**
 * Agent Schema
 */
export const AgentSchema = z.object({
  agentName: z.string(),
  participatesIn: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Member Schema
 */
export const MemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  memberType: MemberTypeSchema.optional(),
  contractName: z.string().optional(),
  contractVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  authType: AuthTypeSchema,
  authConfig: AuthConfigSchema.optional(),
  agents: z.array(AgentSchema).optional(),
  status: MemberStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Route Schema
 */
export const RouteSchema = z.object({
  routePattern: z.string().optional(),
  capability: z.string(),
  operation: z.string().optional(),
  targetRealmId: z.string().optional(),
  targetMemberId: z.string().optional(),
  priority: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

/**
 * Bridge Schemas
 */
export const BridgeContractProvidesSchema = z.object({
  capability: z.string(),
  providedBy: z.string(),
});

export const BridgeContractRequiresSchema = z.object({
  capability: z.string(),
  version: z.string().optional(),
});

export const BridgeContractSchema = z.object({
  name: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  provides: z.array(BridgeContractProvidesSchema),
  requires: z.array(BridgeContractRequiresSchema),
});

export const BridgeSchema = z.object({
  name: z.string(),
  connectionType: ConnectionTypeSchema,
  remoteGatewayUrl: z.string().url(),
  bridgeKey: z.string(),
  connectionConfig: z.record(z.unknown()).optional(),
  localContract: BridgeContractSchema,
  routeToRealm: z.string().optional(),
  active: z.boolean().optional(),
});

/**
 * Realm Schema (Recursive)
 * Using z.lazy to handle circular reference properly
 */
export const RealmSchema: z.ZodType<{
  realmId: string;
  displayName?: string;
  realmType?: 'root' | 'service' | 'tenant' | 'environment' | 'department';
  description?: string;
  contractName?: string;
  contractVersion?: string;
  policies?: string[];
  inheritPolicies?: boolean;
  members?: z.infer<typeof MemberSchema>[];
  routes?: z.infer<typeof RouteSchema>[];
  bridges?: z.infer<typeof BridgeSchema>[];
  children?: any[];
  metadata?: Record<string, unknown>;
}> = z.lazy(() =>
  z.object({
    realmId: z.string(),
    displayName: z.string().optional(),
    realmType: RealmTypeSchema.optional(),
    description: z.string().optional(),
    contractName: z.string().optional(),
    contractVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
    policies: z.array(z.string()).optional(),
    inheritPolicies: z.boolean().optional(),
    members: z.array(MemberSchema).optional(),
    routes: z.array(RouteSchema).optional(),
    bridges: z.array(BridgeSchema).optional(),
    children: z.array(RealmSchema).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
);

/**
 * Policy Schema
 */
export const PolicySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: PolicyTypeSchema,
  config: z.record(z.unknown()).optional(),
});

/**
 * Mesh Configuration Schemas
 */
export const MeshMetadataSchema = z.object({
  meshId: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  previousVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  breakingChanges: z.array(z.string()).optional(),
});

export const HealthCheckConfigSchema = z.object({
  enabled: z.boolean().optional(),
  interval: z.string().optional(),
  timeout: z.string().optional(),
});

export const LoadBalancingConfigSchema = z.object({
  strategy: LoadBalancingStrategySchema.optional(),
  healthCheck: HealthCheckConfigSchema.optional(),
});

export const CapabilityImportSchema = z.object({
  import: z.string(),
});

export const MeshSpecSchema = z.object({
  gatewayUrl: z.string().url(),
  capabilities: z.array(CapabilityImportSchema).optional(),
  policies: z.array(PolicySchema).optional(),
  realms: z.array(RealmSchema).optional(),
  loadBalancing: LoadBalancingConfigSchema.optional(),
});

export const MeshConfigurationSchema = z.object({
  apiVersion: z.literal('interrealm.io/v1alpha1'),
  kind: z.literal('MeshConfiguration'),
  metadata: MeshMetadataSchema,
  spec: MeshSpecSchema,
});
