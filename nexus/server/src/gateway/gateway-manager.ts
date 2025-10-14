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
    // Use noServer: true to manually handle upgrades with full control
    this.wss = new WebSocketServer({
      noServer: true,
      perMessageDeflate: false, // Disable per-message compression
      clientTracking: true
    });

    // Manually handle WebSocket upgrades to prevent ANY compression negotiation
    this.httpServer.on('upgrade', (request, socket, head) => {
      const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);

      if (pathname === '/gateway') {
        // Force remove any compression extension headers from client request
        if (request.headers['sec-websocket-extensions']) {
          delete request.headers['sec-websocket-extensions'];
        }

        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          this.wss!.emit('connection', ws, request);
        });
      } else if (pathname === '/monitor') {
        // Monitor path handled below
        if (request.headers['sec-websocket-extensions']) {
          delete request.headers['sec-websocket-extensions'];
        }

        this.monitorWss!.handleUpgrade(request, socket, head, (ws) => {
          this.monitorWss!.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on('connection', async (ws: WebSocket, req) => {
      try {
        // Log WebSocket handshake headers for debugging
        logger.debug('WebSocket handshake headers:', req.headers);
        logger.debug('WebSocket extensions:', (ws as any).extensions);

        // Advanced RSV1 protection: Force disable compression internals
        // Override _receiver to validate frames don't have RSV1 bit set
        const receiver = (ws as any)._receiver;
        if (receiver) {
          const originalOnData = receiver.onData;
          receiver.onData = function(data: Buffer) {
            // Check if RSV1 bit is set in the frame (bit 6 of first byte)
            if (data.length > 0 && (data[0] & 0x40) !== 0) {
              logger.error('Blocked frame with RSV1 bit set (compressed frame)');
              ws.close(1002, 'Protocol error: unexpected compressed frame');
              return;
            }
            return originalOnData.call(this, data);
          };
        }

        // Override send to force compression off
        const originalSend = ws.send.bind(ws);
        ws.send = function(data: any, options?: any, callback?: any) {
          const safeOptions = {
            ...options,
            compress: false,
            fin: true
          };
          return originalSend(data, safeOptions, callback);
        };

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

        // Start keep-alive mechanism - send ping every 10 seconds
        const keepAliveInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
          } else {
            clearInterval(keepAliveInterval);
          }
        }, 10000);

        // Handle pong responses from client
        ws.on('pong', () => {
          logger.debug(`Keep-alive pong received from ${memberId}`);
        });

        // Setup message handler
        ws.on('message', async (data: Buffer) => {
          await this.handleMessage(memberId, data.toString());
        });

        ws.on('close', async () => {
          clearInterval(keepAliveInterval);
          logger.info(`Member disconnected: ${memberId}`);
          this.activityMonitor.logDisconnection(memberId);
          await this.connectionManager.removeConnection(memberId);
        });

        ws.on('error', (error) => {
          clearInterval(keepAliveInterval);
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
      noServer: true,
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
