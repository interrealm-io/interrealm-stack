# Cross-Realm Routing Test Guide

## Overview

This guide walks you through testing the newly implemented cross-realm service and event routing with policy enforcement.

## What Was Implemented

✅ **Policy Engine** - Full capability access control with wildcard matching and realm constraints
✅ **Service Call Handler** - Cross-realm service routing with policy checks
✅ **Event Handler** - Cross-realm event delivery with policy enforcement
✅ **Seed Script** - Test data with two realms and policies
✅ **Test Script** - CLI test runner for cross-realm ping-pong

## Architecture

```
┌─────────────────┐              ┌─────────────────┐
│  Realm Alpha    │              │   Realm Beta    │
│                 │              │                 │
│  Ping Agent     │              │   Pong Agent    │
│  (ping-member)  │              │  (pong-member)  │
└────────┬────────┘              └────────┬────────┘
         │                                │
         │    WebSocket (port 4000)       │
         │                                │
         └────────┬───────────────────────┘
                  │
         ┌────────▼────────────────────────┐
         │   Nexus Gateway (port 4000)     │
         │                                 │
         │  ┌──────────────────────────┐   │
         │  │   Policy Engine          │   │
         │  │   - Evaluate access      │   │
         │  │   - Match capabilities   │   │
         │  │   - Check constraints    │   │
         │  └──────────────────────────┘   │
         │                                 │
         │  ┌──────────────────────────┐   │
         │  │   Event Router           │   │
         │  │   - Find subscribers     │   │
         │  │   - Apply policies       │   │
         │  │   - Cross-realm delivery │   │
         │  └──────────────────────────┘   │
         └─────────────────────────────────┘
```

## Prerequisites

### 1. Database Seeded
The cross-realm test environment must be seeded:

```bash
cd nexus/server
npm run seed:cross-realm
```

This creates:
- **realm.root** - Parent realm with `allow-child-realms-all` policy
- **realm.alpha** - Child realm with `allow-ping-pong-any` and `allow-test-sibling-realms` policies
- **realm.beta** - Child realm with `allow-ping-pong-any` and `allow-test-sibling-realms` policies
- **Ping member** in realm.alpha (API Key: `alpha-ping-key-12345`)
- **Pong member** in realm.beta (API Key: `beta-pong-key-67890`)

### 2. Nexus Server Running
Start the Nexus server if not already running:

```bash
cd nexus/server
npm run dev
```

Expected output:
```
[Nexus] Server listening on port 4000
[Nexus] WebSocket gateway started on /gateway
[Nexus] Activity monitor started on /monitor
```

### 3. Test Dependencies
Ensure tsx is installed (already done):

```bash
cd mvp/test-agents
npm install
```

## Running the Cross-Realm Test

### Option 1: Automated Test Script (Recommended)

This runs both agents in a single process for 30 seconds:

```bash
cd mvp/test-agents
npm run test:cross-realm
```

**Expected Output:**
```
🚀 Starting Cross-Realm Ping-Pong Test

📝 Registering agents...
   🔵 Ping Agent → realm.alpha
   🟢 Pong Agent → realm.beta

🔌 Connecting to Nexus Gateway...

✅ Both members connected to their respective realms!
   🔵 realm.alpha/ping-member → CONNECTED
   🟢 realm.beta/pong-member → CONNECTED

🏓 Starting cross-realm ping-pong sequence...
───────────────────────────────────────────────────
📤 Sending Ping #1: ping-1-1234567890
📥 Received Ping #1: ping-1-1234567890 from realm.alpha/ping-member
📤 Sending Pong in response to ping-1-1234567890
📥 Received Pong for ping-1-1234567890 from realm.beta/pong-member
   Round-trip time: 15ms
📤 Sending Ping #2: ping-2-1234567891
...
```

**Check Nexus Server Logs:**
```
[Gateway] Event published by realm.alpha/ping-member: test.ping-pong.Ping
[EventHandler] Found 1 potential subscribers across all realms
[PolicyEngine] Evaluating access: realm.alpha -> realm.beta for test.ping-pong.Ping
[PolicyEngine] Policy matched: allow-ping-pong-any, allowed: true
[EventHandler] ✓ Event delivered to realm.beta/pong-member in realm realm.beta
[EventHandler] Event test.ping-pong.Ping routing complete: 1 delivered, 0 blocked by policy

[Gateway] Event published by realm.beta/pong-member: test.ping-pong.Pong
[EventHandler] Found 1 potential subscribers across all realms
[PolicyEngine] Evaluating access: realm.beta -> realm.alpha for test.ping-pong.Pong
[PolicyEngine] Policy matched: allow-ping-pong-any, allowed: true
[EventHandler] ✓ Event delivered to realm.alpha/ping-member in realm realm.alpha
[EventHandler] Event test.ping-pong.Pong routing complete: 1 delivered, 0 blocked by policy
```

### Option 2: Using the Test Agents Web UI

The test-agents app provides a web interface to manage agents, but **both agents cannot run simultaneously** in the same web app instance due to port conflicts.

To use the web UI approach, you would need to:
1. Run ping agent in one browser/instance
2. Run pong agent in another deployment

**Not recommended for cross-realm testing** - use Option 1 instead.

## What to Observe

### ✅ Successful Cross-Realm Routing

1. **Connection Phase:**
   - Both agents connect to their respective realms
   - JWT authentication succeeds
   - Member handshakes complete

2. **Event Publishing:**
   - Ping agent publishes `test.ping-pong.Ping` event in realm.alpha
   - Event reaches gateway with sourceRealmId = "realm.alpha"

3. **Policy Evaluation:**
   - EventHandler finds pong-member subscriber in realm.beta
   - PolicyEngine checks if realm.alpha → realm.beta is allowed for `test.ping-pong.Ping`
   - Policy `allow-ping-pong-any` matches (anyRealm: true)
   - Access granted

4. **Cross-Realm Delivery:**
   - Event delivered to realm.beta/pong-member
   - Pong agent receives event, publishes response
   - Response flows back through same policy check
   - Ping agent receives pong in different realm

5. **Continuous Ping-Pong:**
   - Round-trip continues every ~1 second
   - All cross-realm hops go through policy evaluation
   - Metrics logged for each delivery/block

## Troubleshooting

### Test Script Fails to Connect

**Check Nexus server is running:**
```bash
lsof -i:4000
```

**Check database is accessible:**
```bash
cd nexus/server
npm run prisma:studio
```

### No Events Crossing Realms

**Verify policies are seeded:**
```sql
-- In Prisma Studio or psql
SELECT name, type, config FROM policies WHERE name LIKE 'allow-%';
```

**Check realm configuration:**
```sql
SELECT "realmId", policies, "inheritPolicies" FROM realms WHERE "realmId" IN ('realm.alpha', 'realm.beta');
```

**Enable debug logging in Nexus:**
```bash
# In nexus/server/.env
LOG_LEVEL=debug
```

### Policy Denying Events

**Check policy rules match the capability:**
- Capability in test: `test.ping-pong`
- Event names: `Ping`, `Pong`
- Topic: `ping-pong`

**Verify policy configuration allows bidirectional:**
```json
{
  "capability": "test.ping-pong",
  "operations": ["*"],
  "direction": "bidirectional",
  "allowFrom": { "anyRealm": true },
  "allowTo": { "anyRealm": true }
}
```

### Members Not Found

**Reseed the database:**
```bash
cd nexus/server
npm run seed:cross-realm
```

**Verify members exist:**
```sql
SELECT id, "realmId", name FROM members WHERE id LIKE 'realm.%';
```

## Policy Examples

### Allow All Between Siblings
```typescript
{
  name: 'allow-sibling-realms-all',
  type: 'capability-access',
  config: {
    rules: [{
      capability: '*',
      operations: ['*'],
      direction: 'bidirectional',
      allowFrom: { realmPatterns: ['realm.*'] },
      allowTo: { realmPatterns: ['realm.*'] }
    }]
  }
}
```

### Allow Specific Services
```typescript
{
  name: 'allow-finance-services',
  type: 'capability-access',
  config: {
    rules: [{
      capability: 'finance.accounting',
      operations: ['GetBalance', 'TransferFunds'],
      direction: 'inbound',
      allowFrom: { realmIds: ['realm.finance', 'realm.audit'] }
    }]
  }
}
```

### Restrict to Children Only
```typescript
{
  name: 'child-realms-only',
  type: 'capability-access',
  config: {
    rules: [{
      capability: 'admin.*',
      operations: ['*'],
      direction: 'bidirectional',
      allowFrom: { childRealms: true },
      allowTo: { childRealms: true }
    }]
  }
}
```

## Files Modified/Created

### Modified Files:
- `nexus/server/src/policies/policy-engine.ts` - Full policy engine implementation
- `nexus/server/src/gateway/handlers/service-call.handler.ts` - Service routing with policies
- `nexus/server/src/gateway/handlers/event.handler.ts` - Cross-realm event routing
- `nexus/server/src/gateway/gateway-manager.ts` - Injected PrismaClient, added service-response handler
- `nexus/server/package.json` - Added `seed:cross-realm` script
- `mvp/test-agents/package.json` - Added `test:cross-realm` script

### New Files:
- `nexus/server/seed-cross-realm-test.ts` - Seed script for test data
- `mvp/test-agents/test-cross-realm-ping-pong.ts` - CLI test runner
- `CROSS_REALM_TESTING_GUIDE.md` - This guide

## Next Steps

1. **Test service calls** - Implement a service provider and consumer in different realms
2. **Add rate limiting** - Implement rate-limit policy type
3. **Add audit logging** - Track all policy decisions
4. **CLI tool for type generation** - Generate TypeScript types from resolvable capabilities
5. **Performance monitoring** - Track cross-realm traffic metrics

## Support

For issues:
1. Check Nexus server logs for policy evaluation results
2. Enable debug logging: `LOG_LEVEL=debug` in `.env`
3. Use Prisma Studio to inspect database state
4. Review the implementation guide in `~/Downloads/routing-policiies/`
