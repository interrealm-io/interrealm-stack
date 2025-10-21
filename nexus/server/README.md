# InterRealm Gateway

WebSocket and REST gateway for the RealmMesh architecture.

## Overview

This gateway service provides:
- REST API for realm, member, bridge, policy, and capability management
- WebSocket gateway for real-time communication between realms
- Pluggable authentication providers (API Key, JWT, OAuth2, mTLS)
- Policy engine for access control and rate limiting
- Bridge negotiation and contract compatibility checking
- Loop coordination for multi-realm service calls
- Event pub/sub system

## Project Structure

```
gateway/
├── src/
│   ├── config/          # Configuration (database, environment, logger)
│   ├── controllers/     # HTTP REST controllers
│   ├── services/        # Business logic
│   ├── gateway/         # WebSocket gateway and message handlers
│   ├── auth/            # Pluggable auth providers
│   ├── policies/        # Policy engine
│   ├── bridges/         # Bridge manager
│   ├── repositories/    # Data access layer
│   ├── types/           # TypeScript types
│   ├── middleware/      # Express middleware
│   ├── validators/      # Request validators
│   └── utils/           # Utility functions
├── prisma/              # Database schema and migrations
├── schemas/             # YAML schemas for mesh-config and capabilities
├── scripts/             # Database seeding and type generation
└── tests/               # Test suites
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database (optional)
npm run seed
```

### Development

```bash
# Start in development mode with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database

```bash
# Generate Prisma client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed database
npm run seed
```

### Type Generation

```bash
# Generate TypeScript types from YAML schemas
npm run generate:types
```

## API Documentation

### REST API

- `GET /health` - Health check endpoint
- `GET /api/realms` - List all realms
- `POST /api/realms` - Create a new realm
- `GET /api/members` - List all members
- `POST /api/members` - Register a new member
- `GET /api/bridges` - List all bridges
- `POST /api/bridges` - Create a new bridge
- `GET /api/policies` - List all policies
- `GET /api/capabilities` - List all capabilities

### WebSocket Gateway

Connect to `ws://localhost:8080` (or configured WS_PORT)

Message types:
- `register-realm` - Register a realm with the gateway
- `client-handshake` - Client handshake
- `service-call` - Call a service in another realm
- `service-response` - Response to a service call
- `loop-initiate` - Initiate a multi-realm loop
- `loop-recruitment` - Recruit participants for a loop
- `loop-response` - Response from a loop participant
- `event-publish` - Publish an event
- `event-subscribe` - Subscribe to events

## Configuration

See `.env` file for all configuration options.

Key environment variables:
- `NODE_ENV` - Environment (development, production)
- `PORT` - HTTP server port
- `WS_PORT` - WebSocket server port
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment

1. Build the project: `npm run build`
2. Set production environment variables
3. Run migrations: `npm run prisma:migrate`
4. Start the server: `npm start`

## Architecture

This gateway is part of the RealmMesh architecture, which provides:
- Multi-tenant realm hierarchy
- Contract-based capability system
- Pluggable connection protocols (WebSocket, gRPC, Kafka, etc.)
- Policy-driven access control
- Bridge negotiation between realms
- Loop coordination for distributed operations

## License

MIT
