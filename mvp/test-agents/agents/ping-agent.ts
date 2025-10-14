import { Agent, EventHandler, Realm } from '@interrealm/sdk';

interface PingMessage {
  timestamp: number;
  messageId: string;
  from: string;
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
  version: '1.0.0',
})
export class PingAgent {
  private realm!: Realm;
  private pingPublisher: any;
  private pingCount = 0;
  private maxPings = 10;

  async onInit(realm: Realm): Promise<void> {
    this.realm = realm;

    // Create event publisher for Ping messages
    this.pingPublisher = realm.getEventBus().createPublisher(
      'test.ping-pong',
      'Ping',
      'ping-pong'
    );

    console.log('PingAgent initialized');
  }

  async startPinging(): Promise<void> {
    console.log('Starting ping sequence...');
    await this.sendPing();
  }

  private async sendPing(): Promise<void> {
    if (this.pingCount >= this.maxPings) {
      console.log('Max pings reached, stopping');
      return;
    }

    this.pingCount++;
    const message: PingMessage = {
      timestamp: Date.now(),
      messageId: `ping-${this.pingCount}-${Date.now()}`,
      from: this.realm.getConfig().memberId,
    };

    console.log(`📤 Sending Ping #${this.pingCount}:`, message.messageId);
    await this.pingPublisher.publish(message);
  }

  @EventHandler({
    capability: 'test.ping-pong',
    eventName: 'Pong',
    topic: 'ping-pong',
  })
  async onPongReceived(payload: PongMessage): Promise<void> {
    console.log(`📥 Received Pong for ${payload.originalPingId} from ${payload.from}`);
    console.log(`   Round-trip time: ${Date.now() - payload.timestamp}ms`);

    // Send next ping after a short delay
    setTimeout(() => {
      this.sendPing();
    }, 1000);
  }
}
