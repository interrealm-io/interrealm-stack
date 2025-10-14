/**
 * Capability Types
 * Generated from core/schemas/capability.yaml
 */

export type CapabilityStability = 'experimental' | 'beta' | 'stable' | 'deprecated';

export type LoopType = 'aggregation' | 'voting' | 'bidding' | 'consensus' | 'workflow';

export type WaitStrategy = 'all' | 'quorum' | 'any' | 'majority';

export type AggregationStrategy = 'merge' | 'sum' | 'average' | 'vote' | 'rank' | 'custom';

/**
 * Capability Metadata
 */
export interface CapabilityMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  tags?: string[];
  stability?: CapabilityStability;
  documentation?: string;
  realm?: string;
}

/**
 * Domain Object Definition
 */
export interface DomainObject {
  name: string;
  description?: string;
  schema: Record<string, unknown>;
  examples?: Record<string, unknown>[];
}

/**
 * Schema Reference (for inputs/outputs)
 */
export interface SchemaReference {
  domainObjectRef?: string;
  externalRef?: string;
  inlineSchema?: Record<string, unknown>;
  description?: string;
  optional?: boolean;
}

/**
 * Service Error Definition
 */
export interface ServiceError {
  code: string;
  description?: string;
  httpStatus?: number;
  schema?: Record<string, unknown>;
}

/**
 * Service Definition
 */
export interface Service {
  name: string;
  description?: string;
  timeout?: number;
  retries?: number;
  idempotent?: boolean;
  input?: SchemaReference;
  output?: SchemaReference;
  errors?: ServiceError[];
}

/**
 * Event Filter Definition
 */
export interface EventFilter {
  field: string;
  description?: string;
}

/**
 * Event Definition
 */
export interface Event {
  name: string;
  description?: string;
  topic: string;
  ordering?: boolean;
  payload?: SchemaReference;
  filters?: EventFilter[];
}

/**
 * Loop Recruitment Configuration
 */
export interface LoopRecruitment {
  broadcastMessage?: SchemaReference;
  recruitmentTimeout?: number;
  minParticipants?: number;
  maxParticipants?: number;
}

/**
 * Loop Execution Configuration
 */
export interface LoopExecution {
  participantContribution?: SchemaReference;
  executionTimeout?: number;
  waitStrategy?: WaitStrategy;
}

/**
 * Loop Aggregation Configuration
 */
export interface LoopAggregation {
  strategy?: AggregationStrategy;
  quorum?: number;
  customFunction?: string;
}

/**
 * Loop Definition
 */
export interface Loop {
  name: string;
  type: LoopType;
  description?: string;
  recruitment?: LoopRecruitment;
  execution?: LoopExecution;
  aggregation?: LoopAggregation;
  input?: SchemaReference;
  output?: SchemaReference;
}

/**
 * Loop Stack Step
 */
export interface LoopStackStep {
  loopRef: string;
  condition?: string;
  allowSubLoops?: boolean;
}

/**
 * Loop Stack Definition
 */
export interface LoopStack {
  name: string;
  description?: string;
  input?: SchemaReference;
  output?: SchemaReference;
  loops: LoopStackStep[];
}

/**
 * Capability Specification
 */
export interface CapabilitySpec {
  domainObjects?: DomainObject[];
  services?: Service[];
  events?: Event[];
  loops?: Loop[];
  loopStacks?: LoopStack[];
}

/**
 * Complete Capability Definition
 */
export interface Capability {
  apiVersion: 'interrealm.io/v1alpha1';
  kind: 'Capability';
  metadata: CapabilityMetadata;
  spec: CapabilitySpec;
}
