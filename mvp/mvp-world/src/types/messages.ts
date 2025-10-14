/**
 * Shared message types for ping-pong agents
 */

export interface PingMessage {
  timestamp: number;
  messageId: string;
  from: string;
}

export interface PongMessage {
  timestamp: number;
  messageId: string;
  from: string;
  originalPingId: string;
}
