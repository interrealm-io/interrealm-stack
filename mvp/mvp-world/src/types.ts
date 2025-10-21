// Routing and Policy Types based on Nexus schema

export interface Route {
  id: string;
  routePattern: string;
  capability: string;
  operation?: string;
  targetRealmId: string;
  targetMemberId?: string;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  name: string;
  description?: string;
  type: 'capability-access' | 'rate-limit' | 'audit' | 'authentication' | 'authorization' | 'data-governance' | 'custom';
  config: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PolicyConfig {
  id: string;
  name: string;
  type: 'capability-access' | 'rate-limit' | 'audit';
  rules: any;
}

export interface Realm {
  id: string;
  realmId: string;
  displayName?: string;
  realmType: string;
  description?: string;
  policies: string[]; // Array of policy names
  inheritPolicies: boolean;
  contractName?: string;
  contractVersion?: string;
}

export interface ActivityEvent {
  timestamp: string;
  type: 'connection' | 'disconnection' | 'handshake' | 'message' | 'event' | 'error' | 'routing';
  level: 'info' | 'warn' | 'error' | 'debug';
  memberId?: string;
  realmId?: string;
  message: string;
  data?: any;
}

export interface MonitorMessage {
  type: 'event' | 'history' | 'status';
  event?: ActivityEvent;
  events?: ActivityEvent[];
  enabled?: boolean;
}
