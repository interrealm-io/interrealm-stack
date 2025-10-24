import { logger } from '../../config/logger';
import { ConnectionManager } from '../connection-manager';
import { PolicyEngine, PolicyEvaluationContext } from '../../policies/policy-engine';
import { PrismaClient } from '@prisma/client';
import { WebSocket } from 'ws';

interface ServiceCallPayload {
  requestId: string;
  capability: string;
  serviceName: string;
  input: any;
  timeout?: number;
}

interface ServiceResponsePayload {
  requestId: string;
  result?: any;
  error?: any;
}

interface PendingRequest {
  sourceMemberId: string;
  targetMemberId: string;
  timeoutHandle: NodeJS.Timeout;
  timestamp: number;
}

export class ServiceCallHandler {
  private policyEngine: PolicyEngine;
  private pendingRequests: Map<string, PendingRequest> = new Map();

  constructor(
    private connectionManager: ConnectionManager,
    private prisma: PrismaClient
  ) {
    this.policyEngine = new PolicyEngine(prisma);
    logger.debug('ServiceCallHandler initialized with policy enforcement');
  }

  /**
   * Handle incoming service call from a member
   */
  async handleServiceCall(sourceMemberId: string, payload: ServiceCallPayload): Promise<void> {
    const { requestId, capability, serviceName, input, timeout = 30000 } = payload;

    logger.info(`Service call from ${sourceMemberId}: ${capability}.${serviceName} (request: ${requestId})`);

    try {
      // 1. Get source connection and realm
      const sourceConnection = this.connectionManager.getConnection(sourceMemberId);
      if (!sourceConnection || !sourceConnection.metadata?.realmId) {
        throw new Error('Source member not found or no realm');
      }

      const sourceRealmId = sourceConnection.metadata.realmId;

      // 2. Get source realm details
      const sourceRealm = await this.prisma.realm.findUnique({
        where: { realmId: sourceRealmId }
      });

      if (!sourceRealm) {
        throw new Error(`Source realm ${sourceRealmId} not found in database`);
      }

      // 3. Find target members that provide this capability
      const targetMembers = await this.findServiceProviders(
        capability,
        serviceName
      );

      logger.debug(`Found ${targetMembers.length} potential service providers`);

      if (targetMembers.length === 0) {
        this.sendErrorResponse(sourceConnection.ws, requestId, {
          code: 'SERVICE_NOT_FOUND',
          message: `No provider found for ${capability}.${serviceName}`
        });
        return;
      }

      // 4. Find first allowed target based on policy
      let selectedTarget: typeof targetMembers[0] | null = null;
      let policyResult: any = null;

      for (const targetMember of targetMembers) {
        // Get target realm
        const targetRealm = await this.prisma.realm.findUnique({
          where: { id: targetMember.realmId }
        });

        if (!targetRealm) continue;

        // Evaluate policy
        const evalResult = await this.policyEngine.evaluateAccess({
          sourceRealmId: sourceRealm.realmId,
          sourceMemberId,
          targetRealmId: targetRealm.realmId,
          targetMemberId: targetMember.memberId,
          capability,
          operation: serviceName,
          operationType: 'service',
          direction: sourceRealm.realmId === targetRealm.realmId ? 'inbound' : 'outbound'
        });

        if (evalResult.allowed) {
          selectedTarget = targetMember;
          policyResult = evalResult;
          break;
        } else {
          logger.debug(
            `Target ${targetMember.memberId} rejected by policy: ${evalResult.reason}`
          );
        }
      }

      if (!selectedTarget || !policyResult) {
        logger.warn(`Service call denied: No allowed providers found`);
        this.sendErrorResponse(sourceConnection.ws, requestId, {
          code: 'POLICY_DENIED',
          message: 'No providers allowed by policy'
        });
        return;
      }

      logger.info(
        `Policy check passed: ${policyResult.matchedPolicy}, routing to ${selectedTarget.memberId}`
      );

      // 5. Get target connection
      const targetConnection = this.connectionManager.getConnection(selectedTarget.memberId);
      if (!targetConnection) {
        this.sendErrorResponse(sourceConnection.ws, requestId, {
          code: 'TARGET_OFFLINE',
          message: `Target member ${selectedTarget.memberId} is offline`
        });
        return;
      }

      // 6. Forward service call to target
      const forwardedRequest = {
        type: 'service-request',
        payload: {
          requestId,
          capability,
          serviceName,
          input,
          sourceMemberId,
          sourceRealmId: sourceRealm.realmId
        }
      };

      logger.debug(`Forwarding service call to ${selectedTarget.memberId}`);
      targetConnection.ws.send(JSON.stringify(forwardedRequest));

      // 7. Setup response handler with timeout
      this.setupResponseHandler(
        sourceMemberId,
        selectedTarget.memberId,
        requestId,
        timeout
      );

    } catch (error: any) {
      logger.error(`Error handling service call:`, error);
      const sourceConnection = this.connectionManager.getConnection(sourceMemberId);
      if (sourceConnection) {
        this.sendErrorResponse(sourceConnection.ws, requestId, {
          code: 'INTERNAL_ERROR',
          message: error.message
        });
      }
    }
  }

  /**
   * Handle service response from provider
   */
  async handleServiceResponse(providerMemberId: string, payload: ServiceResponsePayload): Promise<void> {
    const { requestId, result, error } = payload;

    logger.info(`Service response from ${providerMemberId} for request ${requestId}`);

    // Get pending request
    const pendingRequest = this.pendingRequests.get(requestId);
    if (!pendingRequest) {
      logger.warn(`Received response for unknown request: ${requestId}`);
      return;
    }

    // Clear timeout
    clearTimeout(pendingRequest.timeoutHandle);
    this.pendingRequests.delete(requestId);

    // Forward response to original requester
    const sourceConnection = this.connectionManager.getConnection(pendingRequest.sourceMemberId);
    if (!sourceConnection) {
      logger.warn(`Source member ${pendingRequest.sourceMemberId} is no longer connected`);
      return;
    }

    const responseMessage = {
      type: 'service-response',
      payload: {
        requestId,
        result,
        error
      }
    };

    sourceConnection.ws.send(JSON.stringify(responseMessage));
    logger.debug(`Response forwarded to ${pendingRequest.sourceMemberId}`);
  }

  /**
   * Find members that can provide a service
   */
  private async findServiceProviders(
    capability: string,
    serviceName: string
  ): Promise<Array<{ memberId: string; realmId: string }>> {
    // Find all online members
    const members = await this.prisma.member.findMany({
      where: {
        status: 'online'
      },
      select: {
        id: true,
        realmId: true,
        scannedContract: true,
        realm: {
          select: {
            realmId: true
          }
        }
      }
    });

    // Filter members that have the specific service in their contract
    const providers = members.filter(member => {
      const contract = member.scannedContract as any;
      if (!contract?.provided) return false;

      // Find capability in provided capabilities
      const cap = contract.provided.find((c: any) => c.name === capability);
      if (!cap?.services) return false;

      // Check if service exists
      return cap.services.some((s: any) => s.name === serviceName);
    });

    return providers.map(m => ({
      memberId: m.id,
      realmId: m.realmId
    }));
  }

  /**
   * Send error response to member
   */
  private sendErrorResponse(ws: WebSocket, requestId: string, error: any): void {
    ws.send(JSON.stringify({
      type: 'service-response',
      payload: {
        requestId,
        error
      }
    }));
  }

  /**
   * Setup timeout and correlation for service call
   */
  private setupResponseHandler(
    sourceMemberId: string,
    targetMemberId: string,
    requestId: string,
    timeout: number
  ): void {
    const timeoutHandle = setTimeout(() => {
      logger.warn(`Service call timeout for request ${requestId}`);
      
      // Remove from pending
      this.pendingRequests.delete(requestId);

      // Send timeout error to source
      const sourceConnection = this.connectionManager.getConnection(sourceMemberId);
      if (sourceConnection) {
        this.sendErrorResponse(sourceConnection.ws, requestId, {
          code: 'TIMEOUT',
          message: `Service call timed out after ${timeout}ms`
        });
      }
    }, timeout);

    // Store pending request
    this.pendingRequests.set(requestId, {
      sourceMemberId,
      targetMemberId,
      timeoutHandle,
      timestamp: Date.now()
    });

    logger.debug(`Response handler setup for request ${requestId} with ${timeout}ms timeout`);
  }

  /**
   * Cleanup handler for disconnected members
   */
  cleanup(memberId: string): void {
    // Clean up any pending requests for this member
    for (const [requestId, request] of this.pendingRequests.entries()) {
      if (request.sourceMemberId === memberId || request.targetMemberId === memberId) {
        clearTimeout(request.timeoutHandle);
        this.pendingRequests.delete(requestId);
        logger.debug(`Cleaned up pending request ${requestId} for disconnected member ${memberId}`);
      }
    }
  }
}
