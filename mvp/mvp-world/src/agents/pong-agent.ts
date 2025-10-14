import { Agent, EventHandler, Realm } from '@interrealm/sdk';
import { PingMessage, PongMessage } from '../types';

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

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ PongAgent initialized and listening for Pings...`);
  }

  @EventHandler({
    capability: 'test.ping-pong',
    eventName: 'Ping',
    topic: 'ping-pong',
  })
  async onPingReceived(payload: PingMessage): Promise<void> {
    this.pongCount++;
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] 📥 Received Ping #${this.pongCount}: ${payload.messageId} from ${payload.from}`);

    // Send Pong response
    const response: PongMessage = {
      timestamp: payload.timestamp,
      messageId: `pong-${this.pongCount}-${Date.now()}`,
      from: this.realm.getConfig().memberId,
      originalPingId: payload.messageId,
    };

    const sendTimestamp = new Date().toISOString();
    console.log(`[${sendTimestamp}] 📤 Sending Pong response: ${response.messageId}`);

    try {
      await this.pongPublisher.publish(response);
    } catch (error) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] ❌ Error sending pong:`, error);
      throw error;
    }
  }

  getStats() {
    return {
      pongCount: this.pongCount,
    };
  }
}
