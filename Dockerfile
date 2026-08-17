# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests and lockfile
COPY package.json pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY client/cli/package.json ./client/cli/
COPY client/sdk/package.json ./client/sdk/
COPY client/gui/package.json ./client/gui/

# Install workspace dependencies
RUN pnpm install --ignore-scripts

# Copy source code
COPY . .

# Build server distribution
RUN pnpm --filter sayodb-server build

# Stage 2: Minimal Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV SAYODB_PORT=6380
ENV SAYODB_HOST=0.0.0.0

# Copy compiled server distribution and config
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/sayodb.conf ./sayodb.conf

# Persistent data volume for AOF log & RDB snapshots
VOLUME ["/data"]

EXPOSE 6380

CMD ["node", "dist/index.js"]
