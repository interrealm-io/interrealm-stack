import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

export interface ActivityEvent {
  timestamp: string;
  type: 'connection' | 'disconnection' | 'handshake' | 'message' | 'event' | 'error' | 'routing';
  level: 'info' | 'warn' | 'error' | 'debug';
  memberId?: string;
  realmId?: string;
  message: string;
  data?: any;
}

/**
 * ActivityMonitor - Real-time gateway activity stream
 *
 * Provides a debug WebSocket endpoint that streams all gateway activity
 * for monitoring and debugging purposes.
 */
export class ActivityMonitor extends EventEmitter {
  private enabled = false;
  private subscribers: Set<WebSocket> = new Set();
  private activityBuffer: ActivityEvent[] = [];
  private maxBufferSize = 100;

  constructor() {
    super();
  }

  /**
   * Enable activity monitoring
   */
  enable(): void {
    this.enabled = true;
    this.log({
      timestamp: new Date().toISOString(),
      type: 'connection',
      level: 'info',
      message: 'Activity monitoring enabled'
    });
  }

  /**
   * Disable activity monitoring
   */
  disable(): void {
    this.enabled = false;
    this.log({
      timestamp: new Date().toISOString(),
      type: 'connection',
      level: 'info',
      message: 'Activity monitoring disabled'
    });
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Subscribe a WebSocket client to activity stream
   */
  subscribe(ws: WebSocket): void {
    this.subscribers.add(ws);

    // Send recent activity buffer to new subscriber
    if (this.activityBuffer.length > 0) {
      ws.send(JSON.stringify({
        type: 'history',
        events: this.activityBuffer
      }));
    }

    ws.on('close', () => {
      this.subscribers.delete(ws);
    });

    ws.on('error', () => {
      this.subscribers.delete(ws);
    });

    this.log({
      timestamp: new Date().toISOString(),
      type: 'connection',
      level: 'info',
      message: `Monitor client connected (${this.subscribers.size} total)`
    });
  }

  /**
   * Log an activity event
   */
  log(event: ActivityEvent): void {
    // Add to buffer
    this.activityBuffer.push(event);
    if (this.activityBuffer.length > this.maxBufferSize) {
      this.activityBuffer.shift();
    }

    // Broadcast to subscribers if enabled
    if (this.enabled && this.subscribers.size > 0) {
      const message = JSON.stringify({
        type: 'event',
        event
      });

      for (const ws of this.subscribers) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      }
    }

    // Emit for other listeners
    this.emit('activity', event);
  }

  /**
   * Log a connection event
   */
  logConnection(memberId: string, realmId: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      type: 'connection',
      level: 'info',
      memberId,
      realmId,
      message: `Member connected: ${memberId} (realm: ${realmId})`
    });
  }

  /**
   * Log a disconnection event
   */
  logDisconnection(memberId: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      type: 'disconnection',
      level: 'info',
      memberId,
      message: `Member disconnected: ${memberId}`
    });
  }

  /**
   * Log a handshake event
   */
  logHandshake(memberId: string, capabilities: any): void {
    this.log({
      timestamp: new Date().toISOString(),
      type: 'handshake',
      level: 'info',
      memberId,
      message: `Handshake completed: ${memberId}`,
      data: {
        services: capabilities?.provides?.services?.length || 0,
        agents: capabilities?.provides?.agents?.length || 0,
        events: capabilities?.provides?.events?.length || 0
      }
    });
  }

  /**
   * Log an incoming message
   */
  logMessage(memberId: string, messageType: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      type: 'message',
      level: 'debug',
      memberId,
      message: `Message received: ${messageType} from ${memberId}`
    });
  }

  /**
   * Log an event publish
   */
  logEventPublish(memberId: string, realmId: string, capability: string, eventName: string, topic: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      type: 'event',
      level: 'info',
      memberId,
      realmId,
      message: `Event published: ${capability}.${eventName} on topic '${topic}' by ${memberId}`
    });
  }

  /**
   * Log event routing
   */
  logEventRouting(sourceRealmId: string, sourceMemberId: string, targetCount: number): void {
    this.log({
      timestamp: new Date().toISOString(),
      type: 'routing',
      level: 'info',
      realmId: sourceRealmId,
      memberId: sourceMemberId,
      message: `Event routed to ${targetCount} members in realm ${sourceRealmId}`
    });
  }

  /**
   * Log an error
   */
  logError(memberId: string | undefined, error: string, details?: any): void {
    this.log({
      timestamp: new Date().toISOString(),
      type: 'error',
      level: 'error',
      memberId,
      message: `Error: ${error}`,
      data: details
    });
  }

  /**
   * Get current statistics
   */
  getStats(): any {
    return {
      enabled: this.enabled,
      subscribers: this.subscribers.size,
      bufferSize: this.activityBuffer.length,
      maxBufferSize: this.maxBufferSize
    };
  }
}
