# Docker Quick Start

## What We've Created

### Docker Images
- **realmtrix/broker:latest** - InterRealm broker service
- **realmtrix/console:latest** - Web console UI

### Files Created
```
realm-mesh/
├── docker-compose.yml              # Main orchestration file
├── .env.docker                     # Environment variables template
├── DOCKER.md                       # Comprehensive Docker guide
├── broker/service/
│   ├── Dockerfile                  # Broker image definition
│   ├── docker-entrypoint.sh        # Handles DB migration
│   └── .dockerignore              # Build exclusions
└── broker/console/
    ├── Dockerfile                  # Console image definition
    ├── .dockerignore              # Build exclusions
    └── app/api/health/route.ts    # Health check endpoint
```

## Quick Commands

### Start Everything
```bash
make docker-up
# OR
docker-compose up -d
```

This starts:
- PostgreSQL on port 5433
- Broker on ports 8080 (internal), 8443 (external), 3001 (admin)
- Console on port 3000

### View Services
```bash
make docker-ps
# Shows: status, ports, health
```

### View Logs
```bash
make docker-logs              # All services
make docker-logs-broker       # Broker only
make docker-logs-console      # Console only
```

### Stop Everything
```bash
make docker-down              # Keep data
make docker-down-volumes      # Delete data too
```

## Building Images

### Build Locally
```bash
make docker-build             # Build both images
make docker-build-broker      # Broker only
make docker-build-console     # Console only
```

### Push to Docker Hub
```bash
# Login first
docker login -u realmtrix

# Push images
make docker-push-all
# OR individually
make docker-push-broker
make docker-push-console
```

## Environment Variables

### Required for Broker
- `DATABASE_URL` - PostgreSQL connection string
- `ADMIN_API_KEY` - API key for authentication
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### Required for Console
- `NEXT_PUBLIC_GATEWAY_URL` - Broker admin API endpoint
- `NEXT_PUBLIC_API_KEY` - Same as broker's ADMIN_API_KEY

### Using Custom .env
```bash
cp .env.docker .env
# Edit .env with your values
docker-compose --env-file .env up -d
```

## Database Migrations

The broker automatically handles Prisma migrations on startup via `docker-entrypoint.sh`:
1. Waits for PostgreSQL to be ready
2. Runs `prisma db push` to apply schema
3. Starts the broker service

## Accessing Services

After `make docker-up`:

| Service | URL | Description |
|---------|-----|-------------|
| Console | http://localhost:3000 | Web UI |
| Admin API | http://localhost:3001 | Management API |
| Health Check | http://localhost:3001/health | Broker health |
| Console Health | http://localhost:3000/api/health | Console health |
| Internal WS | ws://localhost:8080 | Internal gateway |
| External WS | ws://localhost:8443 | External gateway |
| PostgreSQL | localhost:5433 | Database |

## Troubleshooting

### Check Service Health
```bash
curl http://localhost:3001/health        # Broker
curl http://localhost:3000/api/health    # Console
```

### View Container Logs
```bash
docker logs realm-mesh-broker -f
docker logs realm-mesh-console -f
docker logs realm-mesh-postgres -f
```

### Access Container Shell
```bash
docker exec -it realm-mesh-broker sh
docker exec -it realm-mesh-console sh
```

### Database Access
```bash
docker exec -it realm-mesh-postgres psql -U broker_user -d broker_db
```

### Rebuild After Changes
```bash
docker-compose up -d --build
# OR
make docker-build && make docker-up
```

### Port Conflicts
Edit `docker-compose.yml` ports section if needed:
```yaml
services:
  broker:
    ports:
      - "8081:8080"  # Change from 8080
```

## Next Steps for Production

1. **Update Environment Variables**
   - Change `ADMIN_API_KEY` to a strong secret
   - Use environment-specific .env files

2. **Push to Docker Hub**
   ```bash
   make docker-push-all
   ```

3. **Tag Versions**
   ```bash
   docker tag realmtrix/broker:latest realmtrix/broker:v1.0.0
   docker push realmtrix/broker:v1.0.0
   ```

4. **Setup CI/CD** (see DOCKER.md for GitHub Actions example)

5. **Deploy to Cloud**
   - AWS ECS/EKS
   - Google Cloud Run
   - Azure Container Instances
   - DigitalOcean App Platform

## For VS Code Users

To use without pulling code:

1. Pull images:
   ```bash
   docker pull realmtrix/broker:latest
   docker pull realmtrix/console:latest
   ```

2. Create `docker-compose.yml` locally:
   ```bash
   curl -o docker-compose.yml https://raw.githubusercontent.com/realmtrix/realm-mesh/main/docker-compose.yml
   ```

3. Start services:
   ```bash
   docker-compose up -d
   ```

4. Connect your agents to `ws://localhost:8080` using the Node.js SDK

## Architecture

```
┌─────────────────┐
│   Console UI    │ :3000
│  (Next.js App)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Broker Service │ :8080 (internal WS)
│                 │ :8443 (external WS)
│                 │ :3001 (admin API)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │ :5432 (internal)
│                 │ :5433 (exposed)
└─────────────────┘
```

## Support

For detailed documentation, see `DOCKER.md`

For issues: https://github.com/realmtrix/realm-mesh/issues
