# 🚀 Daemon Deployment Guide

Complete guide for running the Solana trading bot as a continuous daemon with auto-restart capabilities.

---

## Overview

The bot can run continuously in three ways:

1. **PM2** (Recommended for development/small servers)
2. **Systemd** (Recommended for production Linux)
3. **Docker** (Recommended for cloud deployment)

Each method provides:
- ✅ Continuous operation (never stops unless explicitly told)
- ✅ Auto-restart on crash
- ✅ Graceful shutdown handling
- ✅ Process monitoring
- ✅ Logging

---

## Option 1: PM2 (Easiest)

### Prerequisites
```bash
npm install -g pm2
```

### Setup

#### 1. Copy Configuration
```bash
cp .env.example .env
# Edit .env with your wallet and settings
nano .env
```

#### 2. Start with PM2
```bash
pm2 start ecosystem.config.js
```

#### 3. Save PM2 Configuration
```bash
pm2 save
pm2 startup
```

This ensures the bot restarts when the server reboots.

### Commands

```bash
# View running processes
pm2 list

# View logs in real-time
pm2 logs solana-trading-bot

# View specific lines of logs
pm2 logs solana-trading-bot --lines 100

# Monitor bot stats
pm2 monit

# Stop the bot gracefully
pm2 stop solana-trading-bot

# Restart the bot
pm2 restart solana-trading-bot

# Remove from PM2
pm2 delete solana-trading-bot

# View PM2 saved apps
pm2 show solana-trading-bot
```

### Features

- **Auto-restart**: Restarts if process crashes
- **Max restarts**: Limited to 10 restarts per hour (in config)
- **Memory limit**: 512MB max memory usage
- **Graceful shutdown**: Gives bot time to close positions before killing
- **Logging**: All output logged to `logs/pm2-out.log` and `logs/pm2-error.log`

### Monitoring

```bash
# Check if bot is running
pm2 status

# Get bot details
pm2 info solana-trading-bot

# Watch resource usage
pm2 monit
```

---

## Option 2: Systemd (Production Linux)

Recommended for production Linux servers.

### Prerequisites

- Linux operating system (Ubuntu, Debian, CentOS, etc.)
- Root or sudo access
- Node.js installed

### Setup

#### 1. Create System User
```bash
sudo useradd -m -s /bin/bash solana
sudo passwd solana
```

#### 2. Install Application
```bash
sudo mkdir -p /opt/solana-trading-bot
sudo chown solana:solana /opt/solana-trading-bot
sudo cp -r . /opt/solana-trading-bot/
cd /opt/solana-trading-bot
sudo -u solana npm install
```

#### 3. Create .env File
```bash
sudo nano /opt/solana-trading-bot/.env
# Add your configuration
```

#### 4. Install Service File
```bash
sudo cp solana-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
```

#### 5. Enable Service
```bash
sudo systemctl enable solana-bot.service
sudo systemctl start solana-bot.service
```

### Commands

```bash
# Check status
sudo systemctl status solana-bot

# View logs
sudo journalctl -u solana-bot -f

# View last 100 lines
sudo journalctl -u solana-bot -n 100

# View logs from specific time
sudo journalctl -u solana-bot --since "2 hours ago"

# Restart bot
sudo systemctl restart solana-bot

# Stop gracefully
sudo systemctl stop solana-bot

# View service details
systemctl show solana-bot
```

### Service Configuration

The service file (`solana-bot.service`) includes:

- **Restart policy**: On-failure with 30-second delay
- **Max restarts**: 5 restarts in 300 seconds
- **Resource limits**: 1GB memory, 80% CPU
- **Security**: Runs as non-root user, protected filesystem
- **Logging**: Logs to systemd journal

### Monitoring

```bash
# Real-time monitoring
sudo journalctl -u solana-bot -f

# Check if running
systemctl is-active solana-bot

# Get process info
systemctl show solana-bot -p MainPID

# View resource usage
ps aux | grep bot-daemon
```

---

## Option 3: Docker (Cloud Deployment)

Recommended for cloud servers and containerized environments.

### Prerequisites

- Docker installed
- Docker Compose installed (optional but recommended)

### Setup

#### 1. Build Docker Image
```bash
docker build -t solana-trading-bot .
```

#### 2. Create .env File
```bash
cp .env.example .env
nano .env
# Configure your wallet and settings
```

#### 3. Run with Docker Compose (Recommended)
```bash
docker-compose up -d
```

Or run with Docker directly:

```bash
docker run -d \
  --name solana-bot \
  --restart unless-stopped \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/state:/app/state \
  solana-trading-bot
```

### Commands

```bash
# View logs
docker-compose logs -f solana-trading-bot

# View specific number of lines
docker-compose logs -f --tail 100 solana-trading-bot

# Check running containers
docker-compose ps

# Stop gracefully
docker-compose stop

# Restart
docker-compose restart

# Remove container
docker-compose down

# Direct Docker commands
docker logs -f solana-bot
docker exec solana-bot cat logs/trading.log
```

### Configuration

Edit `docker-compose.yml` to customize:

```yaml
environment:
  - WALLET_ADDRESS=your_address
  - DRY_RUN=false
  - SCAN_INTERVAL_SECONDS=30
  # ... other settings
```

### Persistence

The Docker setup mounts volumes for:
- `data/` - Trade history
- `state/` - Bot state
- `logs/` - Log files

These persist across container restarts.

### Health Check

Docker includes a health check that:
- Runs every 5 minutes
- Checks for heartbeat file
- Marks container unhealthy if no heartbeat
- Automatically restarts unhealthy container

---

## Monitoring Frequencies

The daemon implements these monitoring intervals:

| Task | Frequency | Purpose |
|------|-----------|---------|
| Token scanning | 10-30 seconds | Look for trading signals |
| Position checks | Every 10 seconds | Monitor entry/exit conditions |
| Heartbeat | Every 5 minutes | Proof of life signal |
| Metrics snapshot | Every 30 minutes | Save performance metrics |
| Daily summary | Every 24 hours | Send summary alert |

### View Monitoring Data

#### Heartbeat (Every 5 minutes)
```bash
# Check latest heartbeat
cat state/heartbeat.json | jq .

# Last heartbeat timestamp
jq '.timestamp' state/heartbeat.json
```

#### Metrics (Every 30 minutes)
```bash
# View current metrics
cat state/metrics.json | jq .

# Check portfolio P&L
jq '.totalPnl' state/metrics.json
```

#### State
```bash
# View current state
cat state/bot-state.json | jq .

# Check restart count
jq '.restartCount' state/bot-state.json

# Check uptime
jq '.uptime' state/bot-state.json
```

---

## State Persistence

The daemon automatically saves state to survive restarts:

### State File (`state/bot-state.json`)
```json
{
  "sessionId": "session-1707619852000-abc123",
  "startTime": "2025-02-10T23:54:00.000Z",
  "scanCount": 150,
  "tradeCount": 5,
  "isRunning": true,
  "restartCount": 2,
  "lastError": null,
  "lastSaved": "2025-02-10T23:59:00.000Z"
}
```

### Metrics File (`state/metrics.json`)
```json
{
  "totalCapitalDeployed": 1.5,
  "totalRealizedPnl": 0.45,
  "totalUnrealizedPnl": -0.05,
  "totalPnl": 0.40,
  "openPositionsCount": 3,
  "closedPositionsCount": 5,
  "winRate": 80,
  "timestamp": "2025-02-10T23:59:00.000Z"
}
```

### Heartbeat File (`state/heartbeat.json`)
```json
{
  "status": "alive",
  "uptime": 3600.5,
  "scanCount": 150,
  "tradeCount": 5,
  "openPositions": 3,
  "portfolio": { /* metrics */ },
  "memory": {
    "heapUsed": 256,
    "heapTotal": 512
  },
  "timestamp": "2025-02-10T23:59:00.000Z"
}
```

---

## Alerting

The daemon sends alerts via Discord and Telegram for:

### Alert Types

1. **Position Opened** 🎯
   - Token symbol
   - Entry price
   - Position size
   - Stop loss / Take profit

2. **Position Closed** 📊
   - Exit reason (TP/SL)
   - P&L and P&L %
   - Exit price
   - Duration

3. **Portfolio Update** 📈
   - Total P&L
   - Open positions
   - Win rate
   - Return %

4. **Safeguard Triggered** 🚨
   - Portfolio stop loss
   - Daily loss limit
   - Other critical events

5. **Bot Errors** ⚠️
   - Error message
   - Context
   - Timestamp

6. **Daily Summary** 📅
   - Total trades
   - Wins/losses
   - Daily P&L
   - Win rate

### Setup Discord Alerts

1. Create Discord webhook in server settings
2. Copy webhook URL
3. Add to .env:
   ```env
   DISCORD_WEBHOOK_ALERTS=https://discord.com/api/webhooks/...
   ```

### Setup Telegram Alerts

1. Create Telegram bot with @BotFather
2. Get bot token and chat ID
3. Add to .env:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_chat_id
   ```

---

## Error Recovery

The daemon has multiple layers of error handling:

1. **Transient Errors**: Automatically retry
2. **API Failures**: Fall back to cache or skip
3. **Network Issues**: Exponential backoff
4. **Position Errors**: Log and continue
5. **Critical Errors**: Graceful shutdown

### View Error Logs

```bash
# Last 50 errors
tail -50 logs/error.log

# Search for specific errors
grep "OutOfMemory\|Network\|Timeout" logs/error.log

# View error rate
grep -c "ERROR" logs/error.log

# View error context
jq . logs/error.log | grep -A 5 "OutOfMemory"
```

---

## Graceful Shutdown

All deployment methods support graceful shutdown:

### On SIGTERM (Systemd/Docker)
1. Bot stops accepting new trades
2. All open positions closed at market price
3. Final metrics logged
4. State saved
5. Process exits cleanly

### On SIGINT (Ctrl+C)
Same as SIGTERM

### Automatic Restart

If bot crashes unexpectedly:
1. Deployment tool (PM2/Systemd/Docker) detects crash
2. Waits 30 seconds
3. Restarts bot
4. Bot loads state from `bot-state.json`
5. Resumes monitoring with recovered state

---

## Troubleshooting

### Bot keeps restarting

**Check logs:**
```bash
# PM2
pm2 logs solana-trading-bot

# Systemd
sudo journalctl -u solana-bot -f

# Docker
docker logs -f solana-bot
```

**Common causes:**
- Configuration error (check .env)
- RPC endpoint down (check RPC_ENDPOINT)
- Private key invalid (check WALLET_PRIVATE_KEY)
- Out of memory (check resource limits)

### Alerts not sending

**Check Discord webhook:**
```bash
curl -X POST "webhook_url" -d '{"content": "test"}'
```

**Check Telegram bot:**
```bash
# Verify token works
curl https://api.telegram.org/bot{TOKEN}/getMe
```

### State files not updating

**Check permissions:**
```bash
ls -la state/
ls -la data/
ls -la logs/
```

**Check disk space:**
```bash
df -h
```

---

## Production Best Practices

### 1. Use Systemd or Docker (not PM2)
- Better resource isolation
- Better logging integration
- Better restart handling

### 2. Monitor Heartbeats
```bash
# Alert if no heartbeat for 15 minutes
watch -n 300 'cat state/heartbeat.json | jq .timestamp'
```

### 3. Set Up Log Rotation
```bash
# Systemd handles this automatically
# For Docker, adjust docker-compose.yml logging config
```

### 4. Backup State Regularly
```bash
# Hourly backup
0 * * * * cp -r /opt/solana-trading-bot/state /backup/state-$(date +%s)
```

### 5. Monitor Resource Usage
```bash
# For PM2
pm2 monit

# For Systemd
systemctl show solana-bot -p MemoryCurrent,CPUUsageNSec

# For Docker
docker stats solana-bot
```

### 6. Set Alert Thresholds
```bash
# Alert if P&L drops below threshold
# Alert if no trades in 24 hours
# Alert if restart count > 5 in 1 hour
```

---

## Quick Start Commands

### PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 logs solana-trading-bot
```

### Systemd
```bash
sudo cp solana-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now solana-bot
sudo journalctl -u solana-bot -f
```

### Docker
```bash
docker-compose up -d
docker-compose logs -f
```

---

## Next Steps

1. Choose deployment method
2. Follow setup instructions for your method
3. Configure .env with your wallet
4. Set up Discord/Telegram alerts
5. Monitor heartbeat and logs
6. Review monitoring data regularly

**The bot is now running continuously!** 🚀

---

**Last Updated**: 2025-02-10  
**Version**: 1.0.0
