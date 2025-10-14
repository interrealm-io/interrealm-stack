import { WebSocket } from 'ws';
import { logger } from '../config/logger';

export interface ConnectionMetadata {
  realmId: string;
  contractName?: string;
  contractVersion?: string;
  capabilities?: any;
}

export interface Connection {
  memberId: string;
  ws: WebSocket;
  metadata?: ConnectionMetadata;
  connectedAt: Date;
}

export class ConnectionManager {
  private connections: Map<string, Connection> = new Map();

  constructor() {
    logger.debug('ConnectionManager initialized');
  }

  async addConnection(memberId: string, ws: WebSocket, metadata?: ConnectionMetadata): Promise<void> {
    const connection: Connection = {
      memberId,
      ws,
      metadata,
      connectedAt: new Date()
    };

    this.connections.set(memberId, connection);
    logger.info(`Connection added: ${memberId}`);
  }

  async removeConnection(memberId: string): Promise<void> {
    const connection = this.connections.get(memberId);
    if (connection) {
      this.connections.delete(memberId);
      logger.info(`Connection removed: ${memberId}`);
    }
  }

  getConnection(memberId: string): Connection | undefined {
    return this.connections.get(memberId);
  }

  getAllConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  getConnectionsByRealm(realmId: string): Connection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.metadata?.realmId === realmId
    );
  }

  send(memberId: string, message: any): boolean {
    const connection = this.connections.get(memberId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  broadcast(message: any, excludeMemberIds?: string[]): void {
    const exclude = new Set(excludeMemberIds || []);
    for (const [memberId, connection] of this.connections) {
      if (!exclude.has(memberId) && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    }
  }

  broadcastToRealm(realmId: string, message: any, excludeMemberIds?: string[]): void {
    const exclude = new Set(excludeMemberIds || []);
    for (const connection of this.getConnectionsByRealm(realmId)) {
      if (!exclude.has(connection.memberId) && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    }
  }
}
