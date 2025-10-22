# QuickStart Guide

## New Developer Setup (One Command!)

Just cloned the repo? Run this:

```bash
make dev
```

This single command will:
- Generate all `.env` files with sensible defaults
- Install all dependencies (broker, console, SDK, MVP)
- Start PostgreSQL database
- Apply Prisma database schema
- Show you what to do next

Then start the services in separate terminals:
```bash
# Terminal 1
make broker-dev

# Terminal 2
make console-dev
```

## Nexus Gateway Setup

Nexus is the next-generation gateway. To set it up:

```bash
# Generate environment files
make env-nexus          # Creates nexus/server/.env
make env-nexus-console  # Creates nexus/console/.env.local

# Or generate all at once
make env-setup

# Start database and apply schema
make nexus-db-up
make nexus-db-setup

# Start services
make nexus-dev          # Terminal 1: Nexus server
# Open nexus/console and run: npm run dev  # Terminal 2: Nexus console
```

The Nexus console will be available at http://localhost:4001

## Run the Full MVP Demo

Want to see everything in action? One command:

```bash
make mvp
```

This automatically:
- Sets up environment and dependencies
- Starts database
- Launches broker service
- Starts pricing and inventory agents
- Runs the price-check scenario
- Shows you the demo in action!

## Troubleshooting

### Port Already in Use

If you see:
```
❌ ERROR: Port 5433 is already in use!
```

**Option 1: Stop the conflicting process**
```bash
lsof -ti :5433 | xargs kill
make broker-db-up
```

**Option 2: Change the port**
Edit the `Makefile` (line 28):
```makefile
DB_PORT := 5434  # Change from 5433
```

**Option 3: Clean up old Docker containers**
```bash
make broker-db-down
make broker-db-up
```

### Missing .env Files

The Makefile auto-generates `.env` files, but if you need to regenerate them:

```bash
make env-setup           # Generates all .env files
make env-broker          # Just broker .env
make env-console         # Just broker console .env.local
make env-mvp             # Just mvp .env
make env-nexus           # Just nexus server .env
make env-nexus-console   # Just nexus console .env.local
```

All configuration is in the `Makefile` (lines 22-52), so you can customize:
- Database ports
- API keys
- Service ports
- Environment settings

### Database Schema Issues

Reset the database and reapply schema:

```bash
# Broker database
make broker-db-reset

# Nexus database
make nexus-db-reset

# Nuclear option: Destroy ALL databases
make db-nuke-all
```

This will:
- Destroy all data (be careful!)
- Recreate the database
- Apply Prisma schema
- Generate Prisma client

## What Gets Auto-Configured

All non-sensitive configuration is stored in the Makefile:

### Broker Configuration
| Variable | Default | What it's for |
|----------|---------|---------------|
| DB_PORT | 5433 | Broker PostgreSQL port |
| ADMIN_PORT | 3001 | Broker admin API |
| INTERNAL_PORT | 8080 | Internal broker (realms) |
| EXTERNAL_PORT | 8443 | External broker (partners) |
| CONSOLE_PORT | 3000 | Broker web console UI |
| ADMIN_API_KEY | admin-key-123 | Dev API key |

### Nexus Configuration
| Variable | Default | What it's for |
|----------|---------|---------------|
| NEXUS_DB_PORT | 5434 | Nexus PostgreSQL port |
| NEXUS_PORT | 4000 | Nexus server port |
| NEXUS_CONSOLE_PORT | 4001 | Nexus console UI |
| NEXUS_CONSOLE_API_KEY | nexus-console-key-... | Dev API key |
| NEXUS_JWT_SECRET | nexus-jwt-secret-... | JWT signing secret (dev only) |

Change these in the Makefile and run `make env-setup` to regenerate config files.

## Available Commands

```bash
# Help & Setup
make help              # Show all commands with descriptions
make env-setup         # Generate all .env files from Makefile config

# Broker Commands
make broker-dev        # Start broker with hot reload
make console-dev       # Start broker web console
make broker-db-up      # Start broker database
make broker-db-down    # Stop broker database
make broker-db-reset   # Reset broker database (destroys data!)
make broker-db-shell   # Open PostgreSQL shell

# Nexus Commands
make nexus-dev         # Start nexus server with hot reload
make nexus-db-up       # Start nexus database
make nexus-db-down     # Stop nexus database
make nexus-db-reset    # Reset nexus database (destroys data!)
make nexus-db-setup    # Apply Prisma schema to nexus database
make nexus-db-shell    # Open nexus PostgreSQL shell

# Development Workflows
make dev               # Setup dev environment (one command)
make mvp               # Run full MVP demo (one command)
make kill-all          # Kill all running processes
make db-nuke-all       # Nuclear option: destroy ALL databases
```

## Architecture Overview

```
realm-mesh/
├── broker/
│   ├── service/        # Core broker service (WebSocket gateway)
│   └── console/        # Broker web UI (Next.js)
├── nexus/
│   ├── server/         # Next-gen Nexus gateway (Express + Prisma)
│   ├── console/        # Nexus web UI (Next.js)
│   └── shared/         # Shared types & DTOs (TypeScript)
├── mvp/                # MVP demo scenarios
│   ├── agents/         # Sample agents (pricing, inventory)
│   └── scenarios/      # Demo scripts
├── sdk/node/           # Node.js SDK for building realms
└── Makefile            # One-command workflows
```

## Next Steps

1. Start the broker and console (see above)
2. Open http://localhost:3000 to see the console
3. Run `make mvp` to see agents in action
4. Check the MVP scenarios in `mvp/scenarios/` to learn the patterns
5. Build your own realms using the SDK in `sdk/node/`

Happy hacking! 🚀
