# Multi-stage Docker build for Next.js application with Socket.io
# Stage 1: Dependencies
FROM node:20-alpine AS deps
# Install dependencies
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install dependencies based on the preferred package manager
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Generate Prisma Client
RUN npx prisma generate

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1

# Generate Prisma Client again in builder stage
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
# Install required runtime dependencies
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy everything we need
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./next.config.js

# Install Prisma CLI for migrations
RUN npm install -g prisma@5.22.0

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Run migrations and start server
CMD npx prisma migrate deploy && node server.js