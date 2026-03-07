# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL and other required dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

ARG NEXTAUTH_SECRET=build-time-placeholder-secret-32-characters
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create uploads directory if it doesn't exist and ensure it's writable
RUN mkdir -p /app/public/uploads \
  && chown -R nextjs:nodejs /app \
  && chmod 755 /app/public/uploads

USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start by running migrations, then Next.js in production mode
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
