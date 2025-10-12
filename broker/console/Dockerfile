# Multi-stage build for InterRealm Console (Next.js)

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build-time environment variables
# These will be embedded in the Next.js build
ARG NEXT_PUBLIC_GATEWAY_URL=http://localhost:3001
ARG NEXT_PUBLIC_API_KEY=admin-key-123
ARG NEXT_PUBLIC_ADMIN_API_KEY=admin-key-123

ENV NEXT_PUBLIC_GATEWAY_URL=${NEXT_PUBLIC_GATEWAY_URL}
ENV NEXT_PUBLIC_API_KEY=${NEXT_PUBLIC_API_KEY}
ENV NEXT_PUBLIC_ADMIN_API_KEY=${NEXT_PUBLIC_ADMIN_API_KEY}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "server.js"]
