import { logger } from '../config/logger';
import { ConnectionManager } from './connection-manager';

export class MessageRouter {
  constructor(private connectionManager: ConnectionManager) {
    logger.debug('MessageRouter initialized');
  }

  /**
   * Route an event message within a realm
   * This broadcasts the event to all members in the same realm except the sender
   */
  async routeEventInRealm(
    sourceRealmId: string,
    sourceMemberId: string,
    eventMessage: any
  ): Promise<void> {
    logger.debug(`Routing event in realm ${sourceRealmId} from ${sourceMemberId}`);

    // Count recipients
    const realmConnections = this.connectionManager.getConnectionsByRealm(sourceRealmId);
    const recipientCount = realmConnections.filter(c => c.memberId !== sourceMemberId).length;

    // Broadcast to all connections in the same realm, excluding the source
    this.connectionManager.broadcastToRealm(
      sourceRealmId,
      eventMessage,
      [sourceMemberId]
    );

    logger.debug(`Event routed to ${recipientCount} members in realm ${sourceRealmId}`);

    return Promise.resolve();
  }

  /**
   * Route a message to a specific target member
   */
  async routeToMember(targetMemberId: string, message: any): Promise<boolean> {
    const sent = this.connectionManager.send(targetMemberId, message);
    if (sent) {
      logger.debug(`Message routed to member: ${targetMemberId}`);
    } else {
      logger.warn(`Failed to route message to member: ${targetMemberId}`);
    }
    return sent;
  }

  /**
   * Broadcast a message to all members in a realm
   */
  async broadcastToRealm(realmId: string, message: any, excludeMemberIds?: string[]): Promise<void> {
    logger.debug(`Broadcasting to realm: ${realmId}`);
    this.connectionManager.broadcastToRealm(realmId, message, excludeMemberIds);
  }

  /**
   * Broadcast a message to all connected members
   */
  async broadcastToAll(message: any, excludeMemberIds?: string[]): Promise<void> {
    logger.debug('Broadcasting to all members');
    this.connectionManager.broadcast(message, excludeMemberIds);
  }
}
