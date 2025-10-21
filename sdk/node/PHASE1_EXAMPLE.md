# Phase 1: SDK Authentication & Handshake - Example Usage

This document shows how to use the newly refactored SDK with the MVP2 Nexus authentication flow.

## Prerequisites

1. Nexus server running at `http://localhost:3001`
2. A realm created via the console
3. A member created in that realm with an API key

## Example: Creating a Member Service

```typescript
import { Realm, RealmConfig, Service } from '@interrealm/sdk-node';

// Define a service using decorators
@Service({
  capability: 'orders',
  name: 'createOrder',
  description: 'Creates a new order'
})
class OrderService {
  async createOrder(input: { customerId: string; items: any[] }): Promise<any> {
    console.log('Creating order for customer:', input.customerId);

    // Your business logic here
    const order = {
      id: `order-${Date.now()}`,
      customerId: input.customerId,
      items: input.items,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    return order;
  }
}

// Configure the realm with member authentication
const config: RealmConfig = {
  // Realm information
  realmId: 'myorg.production',

  // Member information (obtained from Nexus console)
  memberId: 'myorg.production/order-service',

  // Server endpoints
  serverUrl: 'http://localhost:3001',
  gatewayUrl: 'ws://localhost:3001/gateway',

  // API key (obtained when creating member in console)
  apiKey: 'rm_api_1234567890abcdef...',

  // Contract information
  contractName: 'order-service',
  contractVersion: '1.0.0',

  // Component scanning
  componentPaths: ['./src/**/*.ts'],
  autoDiscovery: true,

  // Optional configuration
  logging: {
    level: 'info'
  },
  authTimeout: 10000,
  connectionTimeout: 15000
};

// Create and initialize the realm
async function main() {
  const realm = new Realm(config);

  // Listen for connection events
  realm.on('ready', () => {
    console.log('✓ Member is ready and connected!');
  });

  realm.on('handshake-failed', ({ error }) => {
    console.error('✗ Handshake failed:', error);
  });

  realm.on('gateway-error', ({ error, code }) => {
    console.error(`✗ Gateway error [${code}]:`, error);
  });

  realm.on('disconnected', () => {
    console.log('Disconnected from gateway');
  });

  // Initialize the realm
  try {
    await realm.initialize();

    // The realm is now connected and registered with the gateway
    console.log('Member service is running...');

  } catch (error) {
    console.error('Failed to initialize realm:', error);
    process.exit(1);
  }
}

main();
```

## Connection Flow

When you call `realm.initialize()`, the following happens:

### Step 1: Component Discovery
```
Step 1: Discovering components...
Found service: orders.createOrder
```

### Step 2: Service Registration
```
Step 2: Registering services...
Registered service: orders.createOrder
```

### Step 3: Agent Registration
```
Step 3: Registering agents...
(none in this example)
```

### Step 4: Gateway Connection with Authentication
```
Step 4: Connecting to Nexus gateway...
Phase 1: Authenticating with Nexus server...
✓ Authentication successful

Phase 2: Building capability manifest...
✓ Capability manifest built
Capability Manifest:
  Provides:
    Services: 1
      - orders.createOrder
    Agents: 0
    Events: 0
  Requires:
    Services: 0
    Events: 0

Phase 3: Connecting to gateway...
✓ Connected to gateway
Sent member handshake for: myorg.production/order-service
✓ Member handshake acknowledged
  Status: connected
  Policies: 1 rules
  Available services: 5
  Available capabilities: 3
```

### Step 5: Event Bus
```
Step 5: Starting event bus...
```

### Complete!
```
✓ Member myorg.production/order-service is ready
```

## What Gets Sent to the Gateway?

The `member-handshake` message includes:

```json
{
  "type": "member-handshake",
  "payload": {
    "memberId": "myorg.production/order-service",
    "realmId": "myorg.production",
    "contractName": "order-service",
    "contractVersion": "1.0.0",
    "capabilities": {
      "provides": {
        "services": [
          {
            "capability": "orders",
            "name": "createOrder",
            "description": "Creates a new order"
          }
        ],
        "agents": [],
        "events": []
      },
      "requires": {
        "services": [],
        "events": []
      }
    },
    "timestamp": "2025-10-14T00:00:00.000Z"
  }
}
```

## Expected Response from Gateway

The gateway should respond with:

```json
{
  "type": "member-handshake-ack",
  "payload": {
    "memberId": "myorg.production/order-service",
    "status": "connected",
    "policies": ["allow:*"],
    "directory": {
      "availableServices": {
        "myorg.production/inventory-service": ["inventory.checkStock"],
        "myorg.production/payment-service": ["payment.processPayment"]
      },
      "availableCapabilities": ["inventory", "payment"],
      "events": {}
    }
  }
}
```

## Getting a Member API Key

To get an API key for your member:

1. Start the Nexus console: `cd nexus/console && npm run dev`
2. Navigate to your realm
3. Click "Add Member"
4. Fill in:
   - Name: `order-service`
   - Type: `service`
   - Contract Name: `order-service`
   - Contract Version: `1.0.0`
5. Click "Create Member"
6. Copy the generated API key (starts with `rm_api_...`)
7. Store it securely - it's only shown once!

## Environment Variables

For production, use environment variables:

```bash
# .env
REALM_ID=myorg.production
MEMBER_ID=myorg.production/order-service
NEXUS_SERVER_URL=http://localhost:3001
NEXUS_GATEWAY_URL=ws://localhost:3001/gateway
MEMBER_API_KEY=rm_api_1234567890abcdef...
CONTRACT_NAME=order-service
CONTRACT_VERSION=1.0.0
```

```typescript
import { config as dotenv } from 'dotenv';
dotenv();

const config: RealmConfig = {
  realmId: process.env.REALM_ID!,
  memberId: process.env.MEMBER_ID!,
  serverUrl: process.env.NEXUS_SERVER_URL!,
  gatewayUrl: process.env.NEXUS_GATEWAY_URL!,
  apiKey: process.env.MEMBER_API_KEY!,
  contractName: process.env.CONTRACT_NAME,
  contractVersion: process.env.CONTRACT_VERSION,
  componentPaths: ['./src/**/*.ts'],
  autoDiscovery: true
};
```

## Next Steps

Phase 1 is complete! The SDK can now:
- ✅ Authenticate with the Nexus server using member API keys
- ✅ Get JWT tokens for WebSocket connections
- ✅ Scan and build capability manifests from decorators
- ✅ Connect to the gateway with JWT authentication
- ✅ Send member handshake with capability information

**Next: Phase 2** - Build the server-side gateway to handle these connections!
