// test-connection.ts
// Test script to verify WebSocket connection and RSV1 fix
import WebSocket from 'ws';

const TOKEN = process.env.JWT_TOKEN || 'YOUR_TOKEN_HERE';
const PORT = process.env.PORT || 3000;
const URL = `ws://localhost:${PORT}/gateway?token=${TOKEN}`;

console.log(`\n🔌 Testing WebSocket connection to: ${URL}\n`);

const ws = new WebSocket(URL, {
  perMessageDeflate: false
});

// Check negotiated extensions during upgrade
ws.on('upgrade', (response) => {
  console.log('📡 Upgrade response headers:');
  console.log(response.headers);
  console.log('\n✓ Sec-WebSocket-Extensions:',
    response.headers['sec-websocket-extensions'] || 'NONE (Good - no compression)');
});

ws.on('open', () => {
  console.log('\n✅ Connected successfully!');
  console.log('Extensions:', (ws as any).extensions || 'none');

  // Send a test member handshake message
  const testMessage = {
    type: 'member-handshake',
    payload: {
      memberId: 'test-member',
      realmId: 'test-realm',
      contractName: 'test-contract',
      contractVersion: '1.0.0',
      capabilities: [],
      timestamp: new Date().toISOString()
    }
  };

  console.log('\n📤 Sending test message:', testMessage.type);
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', (data) => {
  console.log('\n📨 Received message:');
  try {
    const parsed = JSON.parse(data.toString());
    console.log(JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log(data.toString());
  }
});

ws.on('error', (error) => {
  console.error('\n❌ WebSocket Error:', error);
  process.exit(1);
});

ws.on('close', (code, reason) => {
  console.log(`\n🔌 Disconnected: ${code} - ${reason || 'No reason provided'}`);
  process.exit(code === 1000 ? 0 : 1);
});

// Auto-close after 10 seconds
setTimeout(() => {
  console.log('\n⏱️  Test timeout - closing connection');
  ws.close(1000, 'Test complete');
}, 10000);
