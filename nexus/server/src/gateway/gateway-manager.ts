import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../config/logger';
import { ConnectionManager } from './connection-manager';
import { MessageRouter } from './message-router';
import { HandshakeHandler } from './handlers/handshake.handler';
import { ServiceCallHandler } from './handlers/service-call.handler';
import { EventHandler } from './handlers/event.handler';
import { ActivityMonitor } from './activity-monitor';
import { parse as parseUrl } from 'url';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

export class GatewayManager {
  private wss?: WebSocketServer;
  private monitorWss?: WebSocketServer;
  private connectionManager: ConnectionManager;
  private messageRouter: MessageRouter;
  private handshakeHandler: HandshakeHandler;
  private serviceCallHandler: ServiceCallHandler;
  private eventHandler: EventHandler;
  private activityMonitor: ActivityMonitor;

  constructor(private httpServer: HttpServer) {
    logger.debug('GatewayManager initialized');
    this.connectionManager = new ConnectionManager();
    this.messageRouter = new MessageRouter(this.connectionManager);
    this.handshakeHandler = new HandshakeHandler(this.connectionManager);
    this.serviceCallHandler = new ServiceCallHandler(this.connectionManager);
    this.eventHandler = new EventHandler(this.connectionManager, this.messageRouter);
    this.activityMonitor = new ActivityMonitor();

    // Enable monitoring by default in development
    if (config.nodeEnv === 'development') {
      this.activityMonitor.enable();
    }
  }

  async start(): Promise<void> {
    // Main gateway WebSocket server
    this.wss = new WebSocketServer({
      server: this.httpServer,
      path: '/gateway',
      perMessageDeflate: false // Disable compression to avoid bufferUtil issues
    });

    this.wss.on('connection', async (ws: WebSocket, req) => {
      try {
        // Extract JWT token from query string
        const url = parseUrl(req.url || '', true);
        const token = url.query.token as string;

        if (!token) {
          logger.warn('Connection rejected: No JWT token provided');
          this.activityMonitor.logError(undefined, 'Connection rejected: No JWT token provided');
          ws.close(4001, 'Authentication required');
          return;
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.auth.jwtSecret) as { memberId: string; realmId: string };
        const { memberId, realmId } = decoded;

        logger.info(`New WebSocket connection from member: ${memberId} (realm: ${realmId})`);
        this.activityMonitor.logConnection(memberId, realmId);

        // Add connection
        await this.connectionManager.addConnection(memberId, ws, { realmId });

        // Setup message handler
        ws.on('message', async (data: Buffer) => {
          await this.handleMessage(memberId, data.toString());
        });

        ws.on('close', async () => {
          logger.info(`Member disconnected: ${memberId}`);
          this.activityMonitor.logDisconnection(memberId);
          await this.connectionManager.removeConnection(memberId);
        });

        ws.on('error', (error) => {
          logger.error(`WebSocket error for ${memberId}:`, error);
          this.activityMonitor.logError(memberId, `WebSocket error: ${error.message}`);
        });

      } catch (error: any) {
        logger.warn('Connection rejected: Invalid JWT token', error.message);
        this.activityMonitor.logError(undefined, `Invalid JWT: ${error.message}`);
        ws.close(4001, 'Invalid authentication token');
      }
    });

    // Activity monitor WebSocket server (no auth required for debugging)
    this.monitorWss = new WebSocketServer({
      server: this.httpServer,
      path: '/monitor',
      perMessageDeflate: false // Disable compression to avoid bufferUtil issues
    });

    this.monitorWss.on('connection', (ws: WebSocket) => {
      logger.info('Activity monitor client connected');
      this.activityMonitor.subscribe(ws);

      // Handle monitor control messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.command === 'enable') {
            this.activityMonitor.enable();
            ws.send(JSON.stringify({ type: 'status', enabled: true }));
          } else if (message.command === 'disable') {
            this.activityMonitor.disable();
            ws.send(JSON.stringify({ type: 'status', enabled: false }));
          } else if (message.command === 'status') {
            ws.send(JSON.stringify({
              type: 'status',
              ...this.activityMonitor.getStats()
            }));
          }
        } catch (error) {
          logger.error('Monitor message error:', error);
        }
      });
    });

    logger.info('WebSocket gateway started on /gateway');
    logger.info('Activity monitor started on /monitor');
  }

  private async handleMessage(memberId: string, data: string): Promise<void> {
    try {
      const message = JSON.parse(data);
      const { type, payload } = message;

      logger.debug(`Message from ${memberId}: ${type}`);
      this.activityMonitor.logMessage(memberId, type);

      switch (type) {
        case 'member-handshake':
          await this.handshakeHandler.handleClientHandshake(memberId, payload);
          this.activityMonitor.logHandshake(memberId, payload.capabilities);
          break;

        case 'service-call':
          await this.serviceCallHandler.handleServiceCall(memberId, payload);
          break;

        case 'event-publish':
          const connection = this.connectionManager.getConnection(memberId);
          if (connection?.metadata?.realmId) {
            this.activityMonitor.logEventPublish(
              memberId,
              connection.metadata.realmId,
              payload.capability,
              payload.eventName,
              payload.topic
            );
          }
          await this.eventHandler.handleEventPublish(memberId, payload);
          break;

        default:
          logger.warn(`Unknown message type from ${memberId}: ${type}`);
          this.activityMonitor.logError(memberId, `Unknown message type: ${type}`);
      }
    } catch (error: any) {
      logger.error(`Error handling message from ${memberId}:`, error);
      this.activityMonitor.logError(memberId, `Message handling error: ${error.message}`);
    }
  }

  async stop(): Promise<void> {
    if (this.wss) {
      this.wss.close();
      logger.info('WebSocket gateway stopped');
    }
  }

  async getStatus(): Promise<any> {
    const connections = this.connectionManager.getAllConnections();
    return {
      active: this.wss !== undefined,
      connections: connections.length,
      clients: connections.map(c => ({
        memberId: c.memberId,
        realmId: c.metadata?.realmId,
        connectedAt: c.connectedAt
      }))
    };
  }
}
