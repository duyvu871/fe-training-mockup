# Multi-stage Production Dockerfile for POS API
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies for native packages and Prisma
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    openssl-dev \
    libc6-compat \
    && ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies and Prisma requirements
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    openssl-dev \
    libc6-compat \
    && ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsup.config.ts ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code and static files
COPY src/ ./src/
COPY prisma/ ./prisma/
COPY public/ ./public/
COPY postcss.config.js ./
COPY tailwind.config.js ./

# Set Prisma environment variables for Alpine Linux
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build:prod

# Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S express -u 1001

WORKDIR /app

# Install runtime dependencies including OpenSSL for Prisma
RUN apk add --no-cache \
    dumb-init \
    openssl \
    openssl-dev \
    libc6-compat \
    ca-certificates \
    && rm -rf /var/cache/apk/* \
    && update-ca-certificates

# Set Prisma environment variables for production
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./

# Copy built application and static files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy other necessary files
COPY prisma/ ./prisma/

# Create directories and set permissions
RUN mkdir -p uploads logs && \
    chown -R express:nodejs /app

# Switch to non-root user
USER express

# Expose port
EXPOSE 3000

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]
