import { Agent, EventHandler, Realm } from '@interrealm/sdk';
import { PingMessage, PongMessage } from '../types';

@Agent({
  capability: 'test.ping-pong',
  name: 'ping-agent',
  version: '1.0.0',
})
export class PingAgent {
  private realm!: Realm;
  private pingPublisher: any;
  private pingCount = 0;
  private maxPings: number;
  private pingInterval: number;
  private isRunning = false;

  constructor(maxPings: number = 10, pingInterval: number = 1000) {
    this.maxPings = maxPings;
    this.pingInterval = pingInterval;
  }

  async onInit(realm: Realm): Promise<void> {
    this.realm = realm;

    // Create event publisher for Ping messages
    this.pingPublisher = realm.getEventBus().createPublisher(
      'test.ping-pong',
      'Ping',
      'ping-pong'
    );

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ PingAgent initialized`);
  }

  async startPinging(): Promise<void> {
    this.isRunning = true;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🚀 Starting ping sequence (max: ${this.maxPings}, interval: ${this.pingInterval}ms)...`);
    await this.sendPing();
  }

  stopPinging(): void {
    this.isRunning = false;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ⏹️  Ping sequence stopped`);
  }

  private async sendPing(): Promise<void> {
    if (!this.isRunning || this.pingCount >= this.maxPings) {
      if (this.pingCount >= this.maxPings) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] 🏁 Max pings (${this.maxPings}) reached, stopping`);
      }
      return;
    }

    this.pingCount++;
    const message: PingMessage = {
      timestamp: Date.now(),
      messageId: `ping-${this.pingCount}-${Date.now()}`,
      from: this.realm.getConfig().memberId,
    };

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📤 Sending Ping #${this.pingCount}: ${message.messageId}`);

    try {
      await this.pingPublisher.publish(message);
    } catch (error) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] ❌ Error sending ping:`, error);
      throw error;
    }
  }

  @EventHandler({
    capability: 'test.ping-pong',
    eventName: 'Pong',
    topic: 'ping-pong',
  })
  async onPongReceived(payload: PongMessage): Promise<void> {
    const timestamp = new Date().toISOString();
    const roundTripTime = Date.now() - payload.timestamp;

    console.log(`[${timestamp}] 📥 Received Pong for ${payload.originalPingId} from ${payload.from}`);
    console.log(`[${timestamp}]    ⏱️  Round-trip time: ${roundTripTime}ms`);

    // Send next ping after configured interval
    if (this.isRunning) {
      setTimeout(() => {
        this.sendPing();
      }, this.pingInterval);
    }
  }

  getStats() {
    return {
      pingCount: this.pingCount,
      maxPings: this.maxPings,
      isRunning: this.isRunning,
    };
  }
}
