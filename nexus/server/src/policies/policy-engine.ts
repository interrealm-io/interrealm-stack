import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

export interface PolicyEvaluationContext {
  sourceRealmId: string;
  sourceMemberId: string;
  targetRealmId?: string;
  targetMemberId?: string;
  capability: string;
  operation: string;  // Service name or event name
  operationType: 'service' | 'event';
  direction: 'outbound' | 'inbound';
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  reason?: string;
  matchedPolicy?: string;
}

interface RealmConstraint {
  realmIds?: string[];
  realmPatterns?: string[];
  childRealms?: boolean;
  descendantRealms?: boolean;
  anyRealm?: boolean;
}

interface CapabilityAccessRule {
  capability: string;
  operations?: string[];
  direction: 'inbound' | 'outbound' | 'bidirectional';
  allowFrom: RealmConstraint;
  allowTo?: RealmConstraint;
}

interface CapabilityAccessPolicyConfig {
  rules: CapabilityAccessRule[];
}

export class PolicyEngine {
  constructor(private prisma: PrismaClient) {
    logger.debug('PolicyEngine initialized');
  }

  /**
   * Evaluate if an operation is allowed based on realm policies
   */
  async evaluateAccess(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult> {
    try {
      // 1. Get source realm details
      const sourceRealm = await this.prisma.realm.findUnique({
        where: { realmId: context.sourceRealmId },
        include: {
          parent: true,
          children: true
        }
      });

      if (!sourceRealm) {
        return {
          allowed: false,
          reason: `Source realm ${context.sourceRealmId} not found`
        };
      }

      // 2. Collect all applicable policies (with inheritance)
      const policyNames = await this.collectPolicies(sourceRealm);
      
      if (policyNames.length === 0) {
        logger.debug('No policies found, denying by default');
        return {
          allowed: false,
          reason: 'No policies configured for realm'
        };
      }

      // 3. Evaluate each capability-access policy
      for (const policyName of policyNames) {
        const policy = await this.prisma.policy.findUnique({
          where: { name: policyName }
        });

        if (!policy || policy.type !== 'capability-access') {
          continue;
        }

        const result = await this.evaluateCapabilityAccessPolicy(policy, context, sourceRealm);
        
        if (result.matches) {
          logger.debug(`Policy matched: ${policy.name}, allowed: ${result.allowed}`);
          return {
            allowed: result.allowed,
            reason: result.reason,
            matchedPolicy: policy.name
          };
        }
      }

      // Default: deny if no policy explicitly allows
      return {
        allowed: false,
        reason: 'No policy allows this operation'
      };

    } catch (error: any) {
      logger.error('Error evaluating policy:', error);
      return {
        allowed: false,
        reason: `Policy evaluation error: ${error.message}`
      };
    }
  }

  /**
   * Evaluate a single capability access policy
   */
  private async evaluateCapabilityAccessPolicy(
    policy: any,
    context: PolicyEvaluationContext,
    sourceRealm: any
  ): Promise<{ matches: boolean; allowed: boolean; reason?: string }> {
    const config = policy.config as CapabilityAccessPolicyConfig;

    if (!config.rules || !Array.isArray(config.rules)) {
      return { matches: false, allowed: false };
    }

    for (const rule of config.rules) {
      // Check if capability matches
      if (!this.matchesCapability(rule.capability, context.capability)) {
        continue;
      }

      // Check if operation matches
      if (rule.operations && !this.matchesOperation(rule.operations, context.operation)) {
        continue;
      }

      // Check direction
      if (rule.direction !== 'bidirectional' && rule.direction !== context.direction) {
        continue;
      }

      // Check realm constraints based on direction
      let constraintMatch = false;

      if (context.direction === 'inbound' || context.direction === 'outbound') {
        // For both inbound and outbound with bidirectional, check allowFrom
        const otherRealmId = context.targetRealmId || context.sourceRealmId;
        
        constraintMatch = await this.matchesRealmConstraint(
          rule.allowFrom,
          sourceRealm,
          otherRealmId
        );

        // For outbound, also check allowTo if specified
        if (context.direction === 'outbound' && rule.allowTo && !constraintMatch) {
          constraintMatch = await this.matchesRealmConstraint(
            rule.allowTo,
            sourceRealm,
            otherRealmId
          );
        }
      }

      if (constraintMatch) {
        return {
          matches: true,
          allowed: true,
          reason: `Allowed by policy rule for ${rule.capability} (${rule.direction})`
        };
      }
    }

    return { matches: false, allowed: false };
  }

  /**
   * Check if capability pattern matches
   */
  private matchesCapability(pattern: string, capability: string): boolean {
    if (pattern === '*') return true;

    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');

    return new RegExp(`^${regexPattern}$`).test(capability);
  }

  /**
   * Check if operation matches
   */
  private matchesOperation(allowedOps: string[], operation: string): boolean {
    if (allowedOps.includes('*')) return true;
    return allowedOps.includes(operation);
  }

  /**
   * Check if realm constraint is satisfied
   */
  private async matchesRealmConstraint(
    constraint: RealmConstraint,
    currentRealm: any,
    otherRealmId: string
  ): Promise<boolean> {
    // anyRealm: allow from any realm
    if (constraint.anyRealm) {
      logger.debug(`Realm constraint: anyRealm matched`);
      return true;
    }

    // Specific realm IDs
    if (constraint.realmIds && constraint.realmIds.includes(otherRealmId)) {
      logger.debug(`Realm constraint: realmIds matched ${otherRealmId}`);
      return true;
    }

    // Realm patterns (wildcard matching)
    if (constraint.realmPatterns) {
      for (const pattern of constraint.realmPatterns) {
        if (this.matchesRealmPattern(pattern, otherRealmId)) {
          logger.debug(`Realm constraint: pattern ${pattern} matched ${otherRealmId}`);
          return true;
        }
      }
    }

    // Child/descendant realm checks
    if (constraint.childRealms || constraint.descendantRealms) {
      const isChild = await this.isChildRealm(currentRealm.id, otherRealmId);
      
      if (constraint.childRealms && isChild) {
        logger.debug(`Realm constraint: childRealms matched ${otherRealmId}`);
        return true;
      }

      if (constraint.descendantRealms) {
        const isDescendant = await this.isDescendantRealm(currentRealm.id, otherRealmId);
        if (isDescendant) {
          logger.debug(`Realm constraint: descendantRealms matched ${otherRealmId}`);
          return true;
        }
      }
    }

    return false;
  }

  private matchesRealmPattern(pattern: string, realmId: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}$`).test(realmId);
  }

  /**
   * Check if otherRealmId is a direct child of currentRealmUuid
   */
  private async isChildRealm(currentRealmUuid: string, otherRealmId: string): Promise<boolean> {
    const otherRealm = await this.prisma.realm.findUnique({
      where: { realmId: otherRealmId }
    });

    return otherRealm?.parentId === currentRealmUuid;
  }

  /**
   * Check if otherRealmId is a descendant of currentRealmUuid
   */
  private async isDescendantRealm(currentRealmUuid: string, otherRealmId: string): Promise<boolean> {
    let checkRealm = await this.prisma.realm.findUnique({
      where: { realmId: otherRealmId }
    });

    while (checkRealm?.parentId) {
      if (checkRealm.parentId === currentRealmUuid) {
        return true;
      }

      checkRealm = await this.prisma.realm.findUnique({
        where: { id: checkRealm.parentId }
      });
    }

    return false;
  }

  /**
   * Collect all policies applicable to a realm (with inheritance)
   */
  private async collectPolicies(realm: any): Promise<string[]> {
    if (!realm) return [];

    let policies: string[] = [];
    
    // Add realm's own policies
    if (Array.isArray(realm.policies)) {
      policies = [...realm.policies];
    }

    // If inheritance enabled, collect from parent
    if (realm.inheritPolicies && realm.parentId) {
      const parent = await this.prisma.realm.findUnique({
        where: { id: realm.parentId },
        include: {
          parent: true
        }
      });

      if (parent) {
        const parentPolicies = await this.collectPolicies(parent);
        policies = [...policies, ...parentPolicies];
      }
    }

    // Remove duplicates
    const uniquePolicies = Array.from(new Set(policies));
    logger.debug(`Collected policies for realm ${realm.realmId}:`, uniquePolicies);
    
    return uniquePolicies;
  }

  /**
   * Evaluate multiple policies
   */
  async evaluatePolicies(policyIds: string[], context: any): Promise<boolean> {
    for (const policyId of policyIds) {
      const allowed = await this.evaluatePolicy(policyId, context);
      if (!allowed) return false;
    }
    return true;
  }

  /**
   * Load a single policy
   */
  async loadPolicy(policyId: string): Promise<any> {
    return await this.prisma.policy.findUnique({
      where: { name: policyId }
    });
  }

  /**
   * Legacy single policy evaluation
   */
  async evaluatePolicy(policyId: string, context: any): Promise<boolean> {
    const policy = await this.loadPolicy(policyId);
    if (!policy) return false;

    // Simplified evaluation - implement full logic as needed
    return true;
  }
}
