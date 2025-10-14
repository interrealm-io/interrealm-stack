/**
 * Nexus Console Types
 * Types for managing RealmMesh configuration via Nexus
 */

/**
 * Realm type definitions
 */
export type RealmType = 'root' | 'organization' | 'tenant' | 'department' | 'service' | 'user';

/**
 * Realm status definitions
 */
export type RealmStatus = 'active' | 'inactive' | 'error';

/**
 * Core Realm entity
 */
export interface Realm {
  id: string;
  realmId: string; // Human-readable realm identifier
  displayName: string;
  parentId: string | null;
  realmType: RealmType;
  policies: string[];
  inheritPolicies: boolean;
  metadata: Record<string, any>;
  children?: string[]; // Child realm IDs
  members?: Member[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Member type definitions
 */
export type MemberType = 'consumer' | 'provider' | 'agent-runtime' | 'hybrid';

/**
 * Member status definitions
 */
export type MemberStatus = 'online' | 'offline' | 'error';

/**
 * Authentication type definitions
 */
export type AuthType = 'api-key' | 'jwt' | 'mtls';

/**
 * Member entity (SDK clients)
 */
export interface Member {
  id: string;
  name: string;
  realmId: string;
  memberType: MemberType;
  contractName?: string;
  contractVersion?: string;
  authType: AuthType;
  authConfig: Record<string, any>;
  status: MemberStatus;
  metadata: Record<string, any>;
  lastConnected?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Tree node for realm hierarchy visualization
 */
export interface RealmTreeNode {
  id: string;
  realmId: string;
  displayName: string;
  realmType: RealmType;
  parentId: string | null;
  children: string[];
  memberCount?: number;
}
