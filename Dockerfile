# Stage 1: Install dependencies
# We use Node 20 because Next.js 16/React 19 require newer Node versions
FROM node:20-alpine AS deps
# libc6-compat is needed for 'sharp'
# python3, make, g++ are needed if 'better-sqlite3' needs to rebuild from source
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./ 
RUN npm ci

# Stage 2: Build the app
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the project
RUN npm run build

# Stage 3: Production Image (The actual runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENVjq production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create a directory for the SQLite database to ensure permissions work
RUN mkdir -p /app/db
RUN chown nextjs:nodejs /app/db

# Copy the standalone build
COPY --from=builder /app/public ./public
# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Run the server
CMD ["node", "server.js"]