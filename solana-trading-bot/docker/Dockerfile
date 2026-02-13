# Dockerfile for Solana Trading Bot
# Build: docker build -t solana-trading-bot:latest -f docker/Dockerfile .
# Run: docker run -d --name solana-bot --env-file .env -v ./logs:/app/logs -v ./state:/app/state solana-trading-bot:latest

FROM node:22-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy app source
COPY src ./src
COPY .env.example ./.env.example

# Create necessary directories
RUN mkdir -p logs state

# Set environment
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max_old_space_size=512

# Use dumb-init to handle signals properly
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const b = require('fs').readFileSync('state/heartbeat.json', 'utf8'); const h = JSON.parse(b); if(Date.now() - new Date(h.timestamp).getTime() < 600000) process.exit(0); process.exit(1)" || exit 1

# Run the bot daemon
CMD ["node", "src/daemon.js"]
