// TODO: Generate these types from capability.schema.yaml
// Run: npm run generate:types

export interface Capability {
  id: string;
  realmId: string;
  name: string;
  description?: string;
  version: string;
  schema: CapabilitySchema;
  access: CapabilityAccess;
  metadata?: Record<string, any>;
}

export interface CapabilitySchema {
  input?: Record<string, any>;
  output?: Record<string, any>;
}

export type CapabilityAccess = 'public' | 'private' | 'restricted';

export interface CapabilityInvocation {
  capabilityId: string;
  realmId: string;
  input: any;
  requesterId: string;
  requestId: string;
}

export interface CapabilityResult {
  requestId: string;
  success: boolean;
  output?: any;
  error?: string;
}
