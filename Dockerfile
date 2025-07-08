# Multi-stage build for optimized production image
FROM node:22-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nextjs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --include=dev
COPY . .
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 9000
CMD ["dumb-init", "npm", "run", "dev"]

# Build stage
FROM base AS build
ENV NODE_ENV=production
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN chown -R nextjs:nodejs /app

# Production stage
FROM node:22-alpine AS production
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/src ./src
COPY --from=build --chown=nextjs:nodejs /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=9000

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9000/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Expose port
EXPOSE 9000

# Start application with proper signal handling
CMD ["dumb-init", "node", "src/app.js"]
