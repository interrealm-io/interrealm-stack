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
  name: 'pong-agent',
  version: '1.0.0'
})
export class PongAgentClass {
  private realm!: Realm;
  private pongPublisher: any;
  private pongCount = 0;

  async onInit(realm: Realm): Promise<void> {
    this.realm = realm;
    console.log('[PongAgent] Initialized and listening for Pings...');
  }

  @EventHandler({
    capability: 'test.ping-pong',
    eventName: 'Ping',
    topic: 'ping-pong'
  })
  async onPingReceived(payload: PingMessage): Promise<void> {
    this.pongCount++;
    console.log(`📥 Received Ping #${this.pongCount}: ${payload.messageId} from ${payload.from}`);

    // Lazy create publisher on first ping
    if (!this.pongPublisher) {
      this.pongPublisher = this.realm.getEventBus().createPublisher(
        'test.ping-pong',
        'Pong',
        'ping-pong'
      );
    }

    // Send Pong response
    const response: PongMessage = {
      timestamp: payload.timestamp,
      messageId: `pong-${this.pongCount}`,
      from: this.realm.getConfig().memberId,
      originalPingId: payload.messageId
    };

    console.log(`📤 Sending Pong #${this.pongCount} in response to ${payload.messageId}`);
    await this.pongPublisher.publish(response);
  }
}
