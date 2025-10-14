// TODO: Generate these types from mesh-config.schema.yaml
// Run: npm run generate:types

export interface MeshConfig {
  version: string;
  realms: RealmConfig[];
  bridges: BridgeConfig[];
  policies: PolicyConfig[];
}

export interface RealmConfig {
  id: string;
  name: string;
  description?: string;
  capabilities: CapabilityConfig[];
  members?: MemberConfig[];
}

export interface BridgeConfig {
  id: string;
  sourceRealmId: string;
  targetRealmId: string;
  contract: BridgeContract;
}

export interface BridgeContract {
  sharedCapabilities: string[];
  policies: string[];
  bidirectional: boolean;
}

export interface PolicyConfig {
  id: string;
  name: string;
  type: 'capability-access' | 'rate-limit' | 'audit';
  rules: any;
}

export interface MemberConfig {
  id: string;
  name: string;
  roles: string[];
}

export interface CapabilityConfig {
  id: string;
  name: string;
  description?: string;
  version: string;
  access: 'public' | 'private' | 'restricted';
}
