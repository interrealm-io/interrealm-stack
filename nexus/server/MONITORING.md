# Nexus Gateway Activity Monitor

Real-time WebSocket stream for monitoring all gateway activity during development and debugging.

## Features

- **Real-time event streaming** - See connections, handshakes, messages, and routing as they happen
- **Toggle on/off** - Enable/disable monitoring without restarting the server
- **Event buffering** - New connections get recent history (last 100 events)
- **No authentication** - Easy access for development (should be secured in production!)
- **Multiple subscribers** - Multiple monitoring clients can connect simultaneously

## WebSocket Endpoint

```
ws://localhost:3001/monitor
```

## Event Types

The monitor streams these event types:

- **connection** - Member connects to gateway
- **disconnection** - Member disconnects from gateway
- **handshake** - Member completes handshake with capability manifest
- **message** - Any message received from member
- **event** - Event published by a member
- **routing** - Event routed to other members
- **error** - Any error during processing

## Event Structure

```typescript
{
  timestamp: string;          // ISO 8601 timestamp
  type: string;               // Event type (see above)
  level: 'info' | 'warn' | 'error' | 'debug';
  memberId?: string;          // Member who triggered the event
  realmId?: string;           // Realm involved
  message: string;            // Human-readable message
  data?: any;                 // Additional event-specific data
}
```

## Control Commands

Send JSON commands to control monitoring:

### Enable Monitoring
```json
{ "command": "enable" }
```

### Disable Monitoring
```json
{ "command": "disable" }
```

### Get Status
```json
{ "command": "status" }
```

Response:
```json
{
  "type": "status",
  "enabled": true,
  "subscribers": 2,
  "bufferSize": 45,
  "maxBufferSize": 100
}
```

## Web UI

A monitoring web UI is available in the test-agents Next.js app:

```
http://localhost:5001/monitor
```

Features:
- Matrix-style terminal display
- Color-coded events by type and level
- Real-time event counter
- Enable/disable toggle
- Clear events button
- Auto-scroll toggle

## Usage Example - Node.js Client

```typescript
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3001/monitor');

ws.on('open', () => {
  console.log('Monitor connected');

  // Enable monitoring
  ws.send(JSON.stringify({ command: 'enable' }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());

  if (message.type === 'event') {
    const event = message.event;
    console.log(`[${event.timestamp}] ${event.type}: ${event.message}`);
  } else if (message.type === 'history') {
    console.log('Received event history:', message.events.length);
  } else if (message.type === 'status') {
    console.log('Status:', message);
  }
});

ws.on('close', () => {
  console.log('Monitor disconnected');
});
```

## Configuration

Monitoring is **enabled by default** in development mode (`NODE_ENV=development`).

To change this behavior, modify `GatewayManager` constructor:

```typescript
// Enable by default in development
if (config.nodeEnv === 'development') {
  this.activityMonitor.enable();
}
```

## Production Considerations

⚠️ **The monitor endpoint has NO authentication** - it's designed for development only!

For production:
1. Disable monitoring by default
2. Add authentication (API key, JWT, etc.)
3. Restrict to internal networks only
4. Or remove the `/monitor` endpoint entirely

## Debugging Tips

1. **Open split-screen**: Monitor UI on one side, test agents on the other
2. **Watch ping-pong**: See the full message flow between agents
3. **Debug routing**: Verify events reach the right members
4. **Check capability parsing**: See what capabilities are registered during handshake
5. **Track errors**: Catch authentication failures, invalid messages, etc.

## Example: Watching Ping-Pong Flow

1. Start the server: `npm run dev`
2. Open monitor UI: http://localhost:5001/monitor
3. Run ping-pong test in another terminal
4. Watch the activity stream:
   - Two connections (ping-member, pong-member)
   - Two handshakes with capability manifests
   - Ping event published → routed to pong-member
   - Pong event published → routed to ping-member
   - Repeat...

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Gateway        │◄────────┤  ActivityMonitor │
│  (connections,  │         │  (EventEmitter)  │
│   messages,     │         └────────┬─────────┘
│   routing)      │                  │
└─────────────────┘                  │ streams
                                     ▼
                          ┌──────────────────────┐
                          │  WebSocket /monitor  │
                          │  (no auth)           │
                          └──────────┬───────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │  Web UI  │    │  CLI     │    │  Custom  │
              │  Monitor │    │  Client  │    │  Client  │
              └──────────┘    └──────────┘    └──────────┘
```

## Future Enhancements

- [ ] Filter events by type, member, realm
- [ ] Export events to file
- [ ] Replay event history
- [ ] Performance metrics (latency, throughput)
- [ ] Event search/grep
- [ ] Multiple channel support
- [ ] WebSocket compression
