import { logger } from '../../config/logger';
import { ConnectionManager } from '../connection-manager';
import { MessageRouter } from '../message-router';
import { PolicyEngine } from '../../policies/policy-engine';
import { PrismaClient } from '@prisma/client';

interface EventPublishPayload {
  capability: string;
  eventName: string;
  topic: string;
  payload: any;
}

export class EventHandler {
  private policyEngine: PolicyEngine;

  constructor(
    private connectionManager: ConnectionManager,
    private messageRouter: MessageRouter,
    private prisma: PrismaClient
  ) {
    this.policyEngine = new PolicyEngine(prisma);
    logger.debug('EventHandler initialized with cross-realm policy enforcement');
  }

  async handleEventPublish(sourceMemberId: string, payload: EventPublishPayload): Promise<void> {
    const { capability, eventName, topic, payload: eventPayload } = payload;

    logger.info(`Event published by ${sourceMemberId}: ${capability}.${eventName} on topic ${topic}`);
    logger.debug('Event payload:', JSON.stringify(eventPayload, null, 2));

    try {
      // 1. Get source connection to find the realm
      const sourceConnection = this.connectionManager.getConnection(sourceMemberId);
      if (!sourceConnection || !sourceConnection.metadata?.realmId) {
        logger.error(`Cannot route event: source member ${sourceMemberId} not found or no realm`);
        return;
      }

      const sourceRealmId = sourceConnection.metadata.realmId;

      // 2. Get source realm details
      const sourceRealm = await this.prisma.realm.findUnique({
        where: { realmId: sourceRealmId }
      });

      if (!sourceRealm) {
        logger.error(`Source realm ${sourceRealmId} not found in database`);
        return;
      }

      // 3. Create the event message to broadcast
      const eventMessage = {
        type: 'event',
        payload: {
          capability,
          eventName,
          topic,
          payload: eventPayload,
          sourceMemberId,
          sourceRealmId,
          timestamp: new Date().toISOString()
        }
      };

      // 4. Find all potential subscribers across all realms
      const subscribers = await this.findEventSubscribers(capability, eventName, topic);

      logger.debug(`Found ${subscribers.length} potential subscribers across all realms`);

      // 5. Route to each subscriber with policy check
      let deliveryCount = 0;
      let blockedCount = 0;

      for (const subscriber of subscribers) {
        // Skip source
        if (subscriber.memberId === sourceMemberId) {
          logger.debug(`Skipping source member ${sourceMemberId}`);
          continue;
        }

        // Get subscriber realm
        const subscriberRealm = await this.prisma.realm.findUnique({
          where: { id: subscriber.realmId }
        });

        if (!subscriberRealm) {
          logger.warn(`Subscriber realm not found for member ${subscriber.memberId}`);
          continue;
        }

        // Evaluate policy for this subscriber
        const policyResult = await this.policyEngine.evaluateAccess({
          sourceRealmId: sourceRealm.realmId,
          sourceMemberId,
          targetRealmId: subscriberRealm.realmId,
          targetMemberId: subscriber.memberId,
          capability,
          operation: eventName,
          operationType: 'event',
          direction: sourceRealm.realmId === subscriberRealm.realmId ? 'inbound' : 'outbound'
        });

        if (!policyResult.allowed) {
          logger.debug(
            `Event delivery blocked by policy to ${subscriber.memberId} in realm ${subscriberRealm.realmId}: ${policyResult.reason}`
          );
          blockedCount++;
          continue;
        }

        logger.debug(
          `Event allowed to ${subscriber.memberId} in realm ${subscriberRealm.realmId} by policy: ${policyResult.matchedPolicy}`
        );

        // Get subscriber connection and send
        const connection = this.connectionManager.getConnection(subscriber.memberId);
        if (connection?.ws) {
          try {
            connection.ws.send(JSON.stringify(eventMessage));
            deliveryCount++;
            logger.debug(
              `✓ Event delivered to ${subscriber.memberId} in realm ${subscriberRealm.realmId}`
            );
          } catch (error: any) {
            logger.error(`Failed to send event to ${subscriber.memberId}:`, error);
          }
        } else {
          logger.debug(`Subscriber ${subscriber.memberId} is not connected`);
        }
      }

      logger.info(
        `Event ${capability}.${eventName} routing complete: ` +
        `${deliveryCount} delivered, ${blockedCount} blocked by policy, ` +
        `${subscribers.length - deliveryCount - blockedCount} offline/skipped`
      );

    } catch (error: any) {
      logger.error('Error handling event publish:', error);
    }
  }

  /**
   * Find all members subscribed to an event across all realms
   */
  private async findEventSubscribers(
    capability: string,
    eventName: string,
    topic: string
  ): Promise<Array<{ memberId: string; realmId: string }>> {
    // Option 1: Use EventSubscription table if it exists
    // For now, we'll scan member contracts for event handlers

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

    logger.debug(`findEventSubscribers: Found ${members.length} online members for ${capability}.${eventName}`);

    // Filter members that subscribe to this event
    const subscribers = members.filter(member => {
      const contract = member.scannedContract as any;
      logger.debug(`  Checking member ${member.id}, contract:`, JSON.stringify(contract?.eventHandlers || 'no handlers'));

      if (!contract) {
        logger.debug(`  → ${member.id}: No contract, skipping`);
        return false;
      }

      // Check if member has explicit event handlers for this event
      if (contract.eventHandlers) {
        const hasHandler = contract.eventHandlers.some((handler: any) => {
          const matches = handler.capability === capability &&
                 handler.eventName === eventName &&
                 handler.topic === topic;
          logger.debug(`  → ${member.id}: Handler check: ${handler.capability}.${handler.eventName} on ${handler.topic} = ${matches}`);
          return matches;
        });

        if (hasHandler) {
          logger.debug(`  → ${member.id}: ✓ SUBSCRIBED via eventHandlers`);
          return true;
        }
      }

      // Fallback: Check if member requires this capability (for backwards compatibility)
      if (contract.required) {
        const hasCapability = contract.required.some((req: any) => {
          if (typeof req === 'string') {
            return req === capability || req === '*';
          }
          return req.name === capability || req.name === '*';
        });

        // If they require this capability, assume they want all its events
        if (hasCapability) {
          logger.debug(`  → ${member.id}: ✓ SUBSCRIBED via required capabilities`);
        }
        return hasCapability;
      }

      logger.debug(`  → ${member.id}: ✗ Not subscribed`);
      return false;
    });

    return subscribers.map(m => ({
      memberId: m.id,
      realmId: m.realmId
    }));
  }

  /**
   * Handle event subscribe message from client
   */
  async handleEventSubscribe(memberId: string, payload: any): Promise<void> {
    const { capability, eventName, topic } = payload;
    await this.subscribeToEvent(memberId, capability, eventName, topic);
  }

  /**
   * Subscribe a member to an event (for explicit subscription tracking)
   */
  async subscribeToEvent(
    memberId: string,
    capability: string,
    eventName: string,
    topic: string
  ): Promise<void> {
    // Update member's scanned contract to include this event handler
    const member = await this.prisma.member.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      logger.warn(`Cannot subscribe: member ${memberId} not found`);
      return;
    }

    const contract = member.scannedContract as any || {};
    const eventHandlers = contract.eventHandlers || [];

    // Check if already subscribed
    const existing = eventHandlers.find((h: any) =>
      h.capability === capability &&
      h.eventName === eventName &&
      h.topic === topic
    );

    if (!existing) {
      eventHandlers.push({ capability, eventName, topic });
      contract.eventHandlers = eventHandlers;

      await this.prisma.member.update({
        where: { id: memberId },
        data: { scannedContract: contract }
      });

      logger.info(`Member ${memberId} subscribed to ${capability}.${eventName} on ${topic}`);
    } else {
      logger.debug(`Member ${memberId} already subscribed to ${capability}.${eventName} on ${topic}`);
    }
  }

  /**
   * Unsubscribe a member from an event
   */
  async unsubscribeFromEvent(
    memberId: string,
    capability: string,
    eventName: string,
    topic: string
  ): Promise<void> {
    logger.debug(`Member ${memberId} unsubscribed from ${capability}.${eventName} on ${topic}`);
  }
}
