# Docker Deployment Guide

This guide covers running InterRealm Mesh using Docker and Docker Compose.

## Quick Start

### 1. Using Docker Compose (Recommended)

Start all services with one command:

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Build and run the broker service
- Build and run the console UI
- Apply Prisma migrations automatically

Access the services:
- Console UI: http://localhost:3000
- Admin API: http://localhost:3001
- Internal Gateway: ws://localhost:8080
- External Gateway: ws://localhost:8443
- PostgreSQL: localhost:5433

### 2. Stop Services

```bash
docker-compose down
```

To remove volumes (deletes database data):
```bash
docker-compose down -v
```

## Configuration

### Environment Variables

Copy the example environment file:
```bash
cp .env.docker .env
```

Edit `.env` to customize:

```env
# Security
ADMIN_API_KEY=your-secure-api-key

# Environment
NODE_ENV=production
LOG_LEVEL=info

# Console Configuration
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3001
```

### Using Custom Environment File

```bash
docker-compose --env-file .env.custom up -d
```

## Building Images

### Build All Images

```bash
docker-compose build
```

### Build Individual Services

```bash
# Broker only
docker-compose build broker

# Console only
docker-compose build console
```

### Build and Push to Docker Hub

```bash
# Login to Docker Hub
docker login -u realmtrix

# Build and tag images
docker-compose build

# Tag for Docker Hub
docker tag realmtrix/broker:latest realmtrix/broker:v1.0.0
docker tag realmtrix/console:latest realmtrix/console:v1.0.0

# Push to Docker Hub
docker push realmtrix/broker:latest
docker push realmtrix/broker:v1.0.0
docker push realmtrix/console:latest
docker push realmtrix/console:v1.0.0
```

## Using Pre-built Images

If images are already on Docker Hub, you can skip building:

```bash
# Pull latest images
docker pull realmtrix/broker:latest
docker pull realmtrix/console:latest

# Start services (will use pulled images)
docker-compose up -d
```

## Individual Container Usage

### Run Broker Only

```bash
docker run -d \
  --name realm-mesh-broker \
  -p 8080:8080 \
  -p 8443:8443 \
  -p 3001:3001 \
  -e DB_HOST=your-postgres-host \
  -e DB_PORT=5432 \
  -e DB_NAME=broker_db \
  -e DB_USER=broker_user \
  -e DB_PASSWORD=broker_pass \
  -e DATABASE_URL=postgresql://broker_user:broker_pass@your-postgres-host:5432/broker_db \
  -e ADMIN_API_KEY=admin-key-123 \
  realmtrix/broker:latest
```

### Run Console Only

```bash
docker run -d \
  --name realm-mesh-console \
  -p 3000:3000 \
  -e NEXT_PUBLIC_GATEWAY_URL=http://your-broker:3001 \
  -e NEXT_PUBLIC_API_KEY=admin-key-123 \
  realmtrix/console:latest
```

## Development

### Development with Docker Compose

For local development with hot reload, use the Makefile:

```bash
# Start database only
make broker-db-up

# Run broker locally (with hot reload)
make broker-dev

# Run console locally (with hot reload)
make console-dev
```

### Rebuild After Code Changes

```bash
docker-compose up -d --build
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f broker
docker-compose logs -f console
docker-compose logs -f postgres
```

## Troubleshooting

### Database Connection Issues

Check if PostgreSQL is ready:
```bash
docker-compose exec postgres pg_isready -U broker_user -d broker_db
```

View broker logs:
```bash
docker-compose logs broker
```

### Reset Database

```bash
docker-compose down -v
docker-compose up -d
```

### Port Conflicts

If ports are already in use, edit `docker-compose.yml`:

```yaml
services:
  postgres:
    ports:
      - "5434:5432"  # Change from 5433

  broker:
    ports:
      - "8081:8080"  # Change from 8080
      - "8444:8443"  # Change from 8443
      - "3002:3001"  # Change from 3001

  console:
    ports:
      - "3001:3000"  # Change from 3000
```

### Check Container Status

```bash
docker-compose ps
```

### Access Container Shell

```bash
# Broker
docker-compose exec broker sh

# Console
docker-compose exec console sh

# Database
docker-compose exec postgres psql -U broker_user -d broker_db
```

## Health Checks

All services include health checks:

```bash
# Check broker health
curl http://localhost:3001/health

# Check console health
curl http://localhost:3000/api/health

# Check PostgreSQL
docker-compose exec postgres pg_isready -U broker_user -d broker_db
```

## Production Deployment

### Recommended Settings

1. Use strong passwords and API keys
2. Enable TLS/SSL for external gateway
3. Use a reverse proxy (nginx, traefik) for HTTPS
4. Set up monitoring (Prometheus, Grafana)
5. Configure log aggregation
6. Use external PostgreSQL for production
7. Set resource limits in docker-compose.yml:

```yaml
services:
  broker:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Security Checklist

- [ ] Change ADMIN_API_KEY to a strong value
- [ ] Use environment-specific .env files
- [ ] Don't commit .env files to git
- [ ] Set up firewall rules
- [ ] Enable TLS for external connections
- [ ] Use Docker secrets for sensitive data
- [ ] Regularly update base images
- [ ] Scan images for vulnerabilities

## CI/CD Integration

### GitHub Actions Example

See `.github/workflows/docker-publish.yml` for automated builds and pushes to Docker Hub.

### Building in CI

```bash
# Build without cache
docker-compose build --no-cache

# Tag with version
docker tag realmtrix/broker:latest realmtrix/broker:${VERSION}
docker tag realmtrix/console:latest realmtrix/console:${VERSION}

# Push
docker push realmtrix/broker:${VERSION}
docker push realmtrix/console:${VERSION}
```

## Multi-Architecture Builds

To build for multiple platforms (amd64, arm64):

```bash
# Create builder
docker buildx create --name realm-builder --use

# Build and push for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t realmtrix/broker:latest \
  --push \
  broker/service/

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t realmtrix/console:latest \
  --push \
  broker/console/
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/realmtrix/realm-mesh/issues
- Documentation: https://docs.realm-mesh.com
