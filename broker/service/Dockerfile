# Multi-stage build for InterRealm Broker Service

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client (needed for TypeScript compilation)
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install postgresql-client for healthcheck and wait script
RUN apk add --no-cache postgresql-client

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Generate Prisma client in production image
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Environment variables (can be overridden)
ENV NODE_ENV=production \
    INTERNAL_PORT=8080 \
    EXTERNAL_PORT=8443 \
    ADMIN_PORT=3001 \
    LOG_LEVEL=info

# Expose ports
EXPOSE 8080 8443 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
