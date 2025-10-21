# MVP-World Setup Guide

This guide will help you get the mvp-world agents running to test WebSocket connections without Next.js/webpack.

## Prerequisites

1. **Nexus Server Running**: Make sure the Nexus server is running at `http://localhost:3000`
2. **Realm and API Keys**: You need a realm set up with two members (ping-agent and pong-agent) and their API keys

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and edit it with your API keys:

```bash
cp .env.example .env
```

Edit `.env` and set your API keys:

```env
# Realm Configuration
REALM_ID=test.ping-pong-realm
CONTRACT_NAME=test.ping-pong
CONTRACT_VERSION=1.0.0

# Server Configuration
SERVER_URL=http://localhost:3000
GATEWAY_URL=ws://localhost:3000/gateway

# API Keys (Required - get these from your realm setup)
PING_API_KEY=your-ping-agent-api-key-here
PONG_API_KEY=your-pong-agent-api-key-here

# Agent Behavior Configuration
MAX_PINGS=10
PING_INTERVAL=1000
```

### 3. Getting API Keys

If you need to create a realm and get API keys, you can:

1. Use the Nexus Console UI (if available)
2. Use the seed script in the Nexus server
3. Create them programmatically via the Nexus API

For development, check the `nexus/server/seed-test-realm.ts` script or the test-agents configuration.

### 4. Run the Application

**Development mode with hot reload:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## Expected Output

When everything is configured correctly, you should see output like:

```
===========================================
🌐 MVP-World: InterRealm SDK Agents
===========================================

✅ Configuration loaded and validated

📋 Configuration:
   Realm ID: test.ping-pong-realm
   Server URL: http://localhost:3000
   Gateway URL: ws://localhost:3000/gateway
   Contract: test.ping-pong v1.0.0
   Max Pings: 10
   Ping Interval: 1000ms

🔧 Creating Ping Agent Realm...
🔧 Creating Pong Agent Realm...
🤖 Instantiating agents...

🔌 Connecting to Nexus...

✅ PingAgent initialized
✅ PongAgent initialized and listening for Pings...

🔌 Initializing agents with their realms...

✅ Both agents connected and ready!

===========================================
🏓 Starting ping-pong sequence...
===========================================

[timestamp] 🚀 Starting ping sequence (max: 10, interval: 1000ms)...
[timestamp] 📤 Sending Ping #1: ping-1-1234567890
[timestamp] 📥 Received Ping #1: ping-1-1234567890 from test.ping-pong-realm/ping-agent
[timestamp] 📤 Sending Pong response: pong-1-1234567891
[timestamp] 📥 Received Pong for ping-1-1234567890 from test.ping-pong-realm/pong-agent
[timestamp]    ⏱️  Round-trip time: 15ms
...
```

## Troubleshooting

### Connection Refused

If you see connection errors, make sure:
- Nexus server is running at the configured SERVER_URL
- The GATEWAY_URL is correct (should use `ws://` not `http://`)

### Authentication Errors

If you see authentication failures:
- Verify your API keys are correct in `.env`
- Make sure the members exist in the realm
- Check that the realm ID matches

### No Messages Exchanged

If the agents connect but don't exchange messages:
- Check that both agents are using the same realm ID
- Verify the contract name and version match
- Look for any error messages in the console

## Testing WebSocket Issues

This application was created to isolate WebSocket functionality from Next.js/webpack. If you're experiencing the RSV1 error in test-agents:

1. Run mvp-world first to verify the SDK works correctly
2. If mvp-world works but test-agents doesn't, the issue is likely webpack-related
3. Check webpack configuration for WebSocket handling
4. Look for conflicting WebSocket polyfills or transforms

## Next Steps

Once the basic ping-pong is working, you can:

1. Extend the application with a REST API (Express/Fastify)
2. Add more agent types
3. Implement monitoring and metrics
4. Build a management UI on top of the API

## Support

For issues or questions:
- Check the main README.md for architecture details
- Review the agent implementation in `src/agents/`
- Look at the configuration validation in `src/config.ts`
