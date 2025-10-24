# Ping-Pong Cross-Realm Test

Simple test agents demonstrating cross-realm event routing with policy enforcement.

## Overview

- **Ping Agent** - Connects to `realm.alpha`, publishes Ping events
- **Pong Agent** - Connects to `realm.beta`, listens for Ping and responds with Pong

Events flow across realm boundaries via the Nexus Gateway with policy-based access control.

## Prerequisites

1. **Nexus server running** on port 4000
2. **Database seeded** with cross-realm test data:
   ```bash
   cd ../../nexus/server
   npm run seed:cross-realm
   ```

## Running the Agents

### Terminal 1: Start Pong Agent (realm.beta)
```bash
npm run pong
```

### Terminal 2: Start Ping Agent (realm.alpha)
```bash
npm run ping
```

## Expected Output

**Pong Agent (realm.beta):**
```
╔════════════════════════════════════════════════╗
║        🟢 Pong Agent - realm.beta             ║
╚════════════════════════════════════════════════╝

✅ Pong agent connected and ready!
👂 Listening for Ping events from other realms...

📥 Received Ping #1: ping-1 from realm.alpha/ping-member
📤 Sending Pong #1 in response to ping-1
```

**Ping Agent (realm.alpha):**
```
╔════════════════════════════════════════════════╗
║        🔵 Ping Agent - realm.alpha            ║
╚════════════════════════════════════════════════╝

✅ Ping agent connected and ready!
🏓 Starting ping sequence...

📤 Sending Ping #1: ping-1
📥 Received Pong for ping-1 from realm.beta/pong-member
   Round-trip time: 25ms
📤 Sending Ping #2: ping-2
```

**Nexus Server Logs:**
```
[EventHandler] Event published by realm.alpha/ping-member: test.ping-pong.Ping
[PolicyEngine] Evaluating access: realm.alpha -> realm.beta for test.ping-pong.Ping
[PolicyEngine] Policy matched: allow-ping-pong-any, allowed: true
[EventHandler] ✓ Event delivered to realm.beta/pong-member
[EventHandler] Event routing complete: 1 delivered, 0 blocked by policy
```

## Architecture

```
┌─────────────────┐              ┌─────────────────┐
│  realm.alpha    │              │   realm.beta    │
│                 │              │                 │
│  Ping Agent     │─── Ping ────>│  Pong Agent     │
│                 │<─── Pong ────│                 │
└─────────────────┘              └─────────────────┘
         │                                │
         └────── WebSocket Gateway ───────┘
                (Policy Enforcement)
```

## Files

- `src/ping-agent.ts` - Ping agent launcher
- `src/pong-agent.ts` - Pong agent launcher
- `src/agents/PingAgent.ts` - Ping agent class with @Agent decorator
- `src/agents/PongAgent.ts` - Pong agent class with @EventHandler decorator
