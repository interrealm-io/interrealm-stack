# MVP-World: InterRealm SDK Agents

A clean TypeScript Node.js implementation of InterRealm SDK agents, built without Next.js or webpack to isolate and verify WebSocket functionality.

## Purpose

This project was created to:
- Test InterRealm SDK WebSocket connections without Next.js/webpack complexity
- Verify that the RSV1 WebSocket error is isolated to the webpack/Next.js environment
- Provide a clean, production-ready agent implementation pattern

## Project Structure

```
mvp-world/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config.ts             # Environment configuration
│   ├── agents/
│   │   ├── ping-agent.ts     # Ping agent implementation
│   │   └── pong-agent.ts     # Pong agent implementation
│   └── types/
│       ├── index.ts          # Type exports
│       └── messages.ts       # Message type definitions
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variable template
└── README.md                 # This file
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys and configuration
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Usage

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Configuration

All configuration is managed through environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `REALM_ID` | The realm identifier | `test.ping-pong-realm` |
| `SERVER_URL` | Nexus server HTTP URL | `http://localhost:3000` |
| `GATEWAY_URL` | Nexus gateway WebSocket URL | `ws://localhost:3000/gateway` |
| `PING_API_KEY` | API key for ping agent | (required) |
| `PONG_API_KEY` | API key for pong agent | (required) |
| `CONTRACT_NAME` | Capability contract name | `test.ping-pong` |
| `CONTRACT_VERSION` | Contract version | `1.0.0` |
| `MAX_PINGS` | Maximum number of pings | `10` |
| `PING_INTERVAL` | Delay between pings (ms) | `1000` |

## Features

- Full TypeScript with strict type checking
- Comprehensive error handling
- Structured logging with timestamps
- Graceful shutdown (SIGINT/SIGTERM handlers)
- Clean separation of concerns
- Extensible architecture for future REST API integration
- No webpack or Next.js dependencies

## Scripts

- `npm run dev` - Run in development mode with hot reload (tsx watch)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled JavaScript
- `npm run clean` - Remove build artifacts and node_modules

## Architecture

The application follows a clean architecture pattern:

1. **Configuration Layer** (`config.ts`): Loads and validates environment variables
2. **Type Layer** (`types/`): Shared TypeScript interfaces
3. **Agent Layer** (`agents/`): Business logic for ping/pong agents
4. **Application Layer** (`index.ts`): Orchestrates initialization and lifecycle

## Differences from test-agents

This implementation differs from the test-agents Next.js app:

- No webpack or Next.js build pipeline
- Direct Node.js execution via tsx
- Cleaner project structure
- Better separation of concerns
- Environment-based configuration only
- No UI components or API routes

## Next Steps

This application is designed to be extended with:
- Express or Fastify REST API
- Additional agent types
- Monitoring and metrics endpoints
- Health check endpoints
- Agent lifecycle management API
