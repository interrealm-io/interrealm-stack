import { logger } from '../../config/logger';
import { ConnectionManager } from '../connection-manager';
import { MessageRouter } from '../message-router';

interface EventPublishPayload {
  capability: string;
  eventName: string;
  topic: string;
  payload: any;
}

export class EventHandler {
  constructor(
    private connectionManager: ConnectionManager,
    private messageRouter: MessageRouter
  ) {
    logger.debug('EventHandler initialized');
  }

  async handleEventPublish(sourceMemberId: string, payload: EventPublishPayload): Promise<void> {
    const { capability, eventName, topic, payload: eventPayload } = payload;

    logger.info(`Event published by ${sourceMemberId}: ${capability}.${eventName} on topic ${topic}`);
    logger.debug('Event payload:', JSON.stringify(eventPayload, null, 2));

    // Get source connection to find the realm
    const sourceConnection = this.connectionManager.getConnection(sourceMemberId);
    if (!sourceConnection || !sourceConnection.metadata?.realmId) {
      logger.error(`Cannot route event: source member ${sourceMemberId} not found or no realm`);
      return;
    }

    const sourceRealmId = sourceConnection.metadata.realmId;

    // Create the event message to broadcast
    const eventMessage = {
      type: 'event',
      payload: {
        capability,
        eventName,
        topic,
        payload: eventPayload,
        sourceMemberId,
        timestamp: new Date().toISOString()
      }
    };

    // Route the event to all members in the same realm (except the source)
    await this.messageRouter.routeEventInRealm(
      sourceRealmId,
      sourceMemberId,
      eventMessage
    );

    logger.info(`Event ${capability}.${eventName} routed to realm ${sourceRealmId}`);
  }
}
