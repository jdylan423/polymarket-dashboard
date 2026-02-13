# Dockerfile for Solana Trading Bot
# Build: docker build -t solana-trading-bot .
# Run: docker run -d --env-file .env solana-trading-bot

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies (minimal Alpine image)
RUN apk add --no-cache \
    dumb-init \
    curl \
    bash \
    ca-certificates

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files
COPY src/ ./src/
COPY .env.example ./

# Create necessary directories
RUN mkdir -p \
    logs \
    data \
    state

# Set permissions
RUN chmod -R 755 /app && \
    chmod -R 777 /app/logs \
    chmod -R 777 /app/data \
    chmod -R 777 /app/state

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Start the bot
CMD ["node", "src/bot-daemon.js"]

# Labels
LABEL maintainer="Solana Trading Bot"
LABEL description="Autonomous momentum trading bot for Solana DEX tokens"
LABEL version="1.0.0"

# Health check
HEALTHCHECK --interval=5m --timeout=30s --retries=3 --start-period=30s \
    CMD curl -f http://localhost/health || exit 1 || \
    test -f /app/state/heartbeat.json || exit 1
