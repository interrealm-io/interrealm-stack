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
  name: 'pong-agent',
  version: '1.0.0',
})
export class PongAgent {
  private realm!: Realm;
  private pongPublisher: any;
  private pongCount = 0;

  async onInit(realm: Realm): Promise<void> {
    this.realm = realm;

    // Create event publisher for Pong messages
    this.pongPublisher = realm.getEventBus().createPublisher(
      'test.ping-pong',
      'Pong',
      'ping-pong'
    );

    console.log('PongAgent initialized and listening for Pings...');
  }

  @EventHandler({
    capability: 'test.ping-pong',
    eventName: 'Ping',
    topic: 'ping-pong',
  })
  async onPingReceived(payload: PingMessage): Promise<void> {
    this.pongCount++;
    console.log(`📥 Received Ping #${this.pongCount}: ${payload.messageId} from ${payload.from}`);

    // Send Pong response
    const response: PongMessage = {
      timestamp: payload.timestamp,
      messageId: `pong-${this.pongCount}-${Date.now()}`,
      from: this.realm.getConfig().memberId,
      originalPingId: payload.messageId,
    };

    console.log(`📤 Sending Pong response: ${response.messageId}`);
    await this.pongPublisher.publish(response);
  }
}
