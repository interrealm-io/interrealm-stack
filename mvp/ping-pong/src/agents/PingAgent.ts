import { Agent, EventHandler, Realm } from '@interrealm/sdk';
import 'reflect-metadata';

interface PingMessage {
  timestamp: number;
  messageId: string;
  from: string;
  count: number;
}

interface PongMessage {
  timestamp: number;
  messageId: string;
  from: string;
  originalPingId: string;
}

@Agent({
  capability: 'test.ping-pong',
  name: 'ping-agent',
  version: '1.0.0'
})
export class PingAgentClass {
  private realm!: Realm;
  private pingPublisher: any;
  private pingCount = 0;

  async onInit(realm: Realm): Promise<void> {
    this.realm = realm;
    console.log('[PingAgent] Initialized');
  }

  async startPinging(): Promise<void> {
    // Create event publisher for Ping messages
    this.pingPublisher = this.realm.getEventBus().createPublisher(
      'test.ping-pong',
      'Ping',
      'ping-pong'
    );

    console.log('[PingAgent] Starting ping sequence...');
    await this.sendPing();
  }

  private async sendPing(): Promise<void> {
    this.pingCount++;

    const message: PingMessage = {
      timestamp: Date.now(),
      messageId: `ping-${this.pingCount}`,
      from: this.realm.getConfig().memberId,
      count: this.pingCount
    };

    console.log(`📤 Sending Ping #${this.pingCount}: ${message.messageId}`);
    await this.pingPublisher.publish(message);
  }

  @EventHandler({
    capability: 'test.ping-pong',
    eventName: 'Pong',
    topic: 'ping-pong'
  })
  async onPongReceived(payload: PongMessage): Promise<void> {
    const roundTripTime = Date.now() - payload.timestamp;
    console.log(`📥 Received Pong for ${payload.originalPingId} from ${payload.from}`);
    console.log(`   Round-trip time: ${roundTripTime}ms`);

    // Send next ping after 1 second
    setTimeout(() => {
      this.sendPing();
    }, 1000);
  }
}
