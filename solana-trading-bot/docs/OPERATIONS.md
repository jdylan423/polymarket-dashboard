# Solana Trading Bot - Operations Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Running the Bot](#running-the-bot)
4. [Monitoring](#monitoring)
5. [Logs and Diagnostics](#logs-and-diagnostics)
6. [Emergency Procedures](#emergency-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Quick Start

### Option 1: Direct Node.js (Development)
```bash
# Install dependencies
npm install

# Start the bot
npm start

# Watch mode (auto-reload on changes)
npm run dev

# View logs
npm run logs
```

### Option 2: PM2 (Production Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Auto-start on reboot
pm2 startup
pm2 save

# View status
pm2 status

# View logs
pm2 logs solana-trading-bot

# Restart
pm2 restart solana-trading-bot

# Stop gracefully
pm2 stop solana-trading-bot

# Delete app
pm2 delete solana-trading-bot
```

### Option 3: Systemd Service (Linux)
```bash
# Copy service file
sudo cp solana-bot.service /etc/systemd/system/

# Edit if needed (paths, user)
sudo nano /etc/systemd/system/solana-bot.service

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable solana-bot
sudo systemctl start solana-bot

# Check status
sudo systemctl status solana-bot

# View logs
sudo journalctl -u solana-bot -f

# Stop gracefully
sudo systemctl stop solana-bot
```

### Option 4: Docker
```bash
# Build image
docker build -t solana-trading-bot:latest -f docker/Dockerfile .

# Run container
docker run -d \
  --name solana-bot \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/state:/app/state \
  solana-trading-bot:latest

# Or use docker-compose
docker-compose -f docker/docker-compose.yml up -d

# Check status
docker ps
docker logs solana-bot -f

# Stop gracefully
docker stop solana-bot
docker rm solana-bot
```

---

## Architecture

### Core Components

**Daemon Loop (src/daemon.js)**
- Main orchestration layer
- Market scanning: Every 10-30 seconds
- Position checking: Every 10 seconds
- Heartbeat logging: Every 5 minutes
- Metrics snapshots: Every 30 minutes
- Daily summaries: Every 24 hours

**Alert System (src/alerts.js)**
- Discord webhook integration
- Telegram bot support
- Rate limiting (prevents spam)
- Alert queue with persistence
- Multi-channel delivery

**Heartbeat System (src/heartbeat.js)**
- Periodic health checks (every 5 minutes)
- Logs to `logs/heartbeat.log`
- Memory and uptime tracking
- Health status aggregation
- Recovery monitoring

**State Management (src/stateManager.js)**
- Persistent state storage
- Daily automated backups
- Position recovery on crash
- Metrics persistence
- Error tracking

### Directory Structure
```
solana-trading-bot/
├── src/
│   ├── daemon.js              # Main daemon orchestration
│   ├── alerts.js              # Alert system
│   ├── heartbeat.js           # Heartbeat tracking
│   ├── stateManager.js        # State persistence
│   ├── bot.js                 # Original bot (reference)
│   ├── bot-daemon.js          # Daemon implementation
│   ├── positionManager.js     # Position management
│   ├── tradeExecution.js      # Trade execution
│   ├── jupiterData.js         # Jupiter data source
│   ├── sentimentAnalysis.js   # Sentiment analysis
│   ├── config.js              # Configuration
│   └── logger.js              # Logging system
├── logs/
│   ├── trading.log            # General logs
│   ├── trades.log             # Trade-specific logs
│   ├── error.log              # Error logs
│   ├── sentiment.log          # Sentiment logs
│   ├── heartbeat.log          # Heartbeat logs
│   └── pm2-*.log              # PM2 process logs (if using PM2)
├── state/
│   ├── bot-state.json         # Current state snapshot
│   ├── metrics.json           # Portfolio metrics
│   ├── heartbeat.json         # Latest heartbeat
│   └── backups/               # Daily backups
│       ├── bot-state-2024-02-11.json
│       └── metrics-2024-02-11.json
├── docs/
│   └── OPERATIONS.md          # This file
├── docker/
│   ├── Dockerfile             # Docker build
│   └── docker-compose.yml     # Docker Compose setup
├── .env                       # Configuration (KEEP SECRET!)
├── ecosystem.config.js        # PM2 configuration
├── solana-bot.service         # Systemd service
└── package.json
```

---

## Running the Bot

### Configuration

Create a `.env` file with your settings:
```bash
cp .env.example .env
nano .env
```

Required environment variables:
```bash
# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WALLET_PRIVATE_KEY=your_private_key_here

# Jupiter API
JUPITER_API_KEY=your_jupiter_key

# Alerts
DISCORD_WEBHOOK_ALERTS=https://discordapp.com/api/webhooks/YOUR/WEBHOOK
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Optional: Risk Management
STARTING_CAPITAL_SOL=100
MAX_POSITION_SIZE_SOL=5
MAX_SIMULTANEOUS_POSITIONS=5
```

### Starting the Bot

**Direct start (development):**
```bash
node src/daemon.js
```

**PM2 start (production):**
```bash
pm2 start ecosystem.config.js
pm2 save
```

**Docker start:**
```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Verifying Startup

The bot will output:
```
═══════════════════════════════════════════════════════════════
🤖 Solana Momentum Trading Bot Daemon v1.0.0
═══════════════════════════════════════════════════════════════
Starting Daemon...
  sessionId: session-1707636000000-xyz
  restartCount: 1
  timestamp: 2024-02-11T00:00:00.000Z
💰 Wallet Balance: 50.1234 SOL
═══════════════════════════════════════════════════════════════
✅ Bot daemon started successfully!
═══════════════════════════════════════════════════════════════
```

---

## Monitoring

### Check Bot Status

**Direct process:**
```bash
ps aux | grep daemon.js
```

**PM2:**
```bash
pm2 status
pm2 info solana-trading-bot
```

**Systemd:**
```bash
sudo systemctl status solana-bot
```

**Docker:**
```bash
docker ps -a
docker stats solana-bot
```

### Monitor Logs

**Real-time logs:**
```bash
# All logs
tail -f logs/trading.log

# Just trades
tail -f logs/trades.log

# Just errors
tail -f logs/error.log

# Just heartbeats
tail -f logs/heartbeat.log

# With PM2
pm2 logs solana-trading-bot

# With Systemd
sudo journalctl -u solana-bot -f

# With Docker
docker logs -f solana-bot
```

### Health Checks

**Check heartbeat status:**
```bash
# Last heartbeat
cat state/heartbeat.json | jq .

# Health status (from heartbeat.log)
tail -1 logs/heartbeat.log | jq .

# All heartbeats
tail -20 logs/heartbeat.log | jq .
```

**Check bot metrics:**
```bash
cat state/metrics.json | jq .

# Show specific metrics
cat state/metrics.json | jq '.totalPnl, .winRate, .openPositionsCount'
```

**Monitor memory usage:**
```bash
# With PM2
pm2 monit

# Real-time via logs
tail -f logs/heartbeat.log | jq '.memory'

# With Docker
docker stats solana-bot --no-stream
```

---

## Logs and Diagnostics

### Log Files

| File | Purpose |
|------|---------|
| `logs/trading.log` | All events (comprehensive) |
| `logs/trades.log` | Trade opens/closes only |
| `logs/error.log` | Errors only |
| `logs/sentiment.log` | Sentiment analysis data |
| `logs/heartbeat.log` | Health check events |
| `state/heartbeat.json` | Latest heartbeat JSON |
| `state/bot-state.json` | Bot state snapshot |
| `state/metrics.json` | Portfolio metrics |

### Tail Multiple Logs

```bash
# Watch all important logs in one terminal
tail -f logs/trading.log logs/error.log logs/heartbeat.log

# Or use a tool like tmux:
tmux new-session -d -s monitor
tmux split-window -h
tmux send-keys -t monitor:0 "tail -f logs/trading.log" Enter
tmux send-keys -t monitor:1 "tail -f logs/error.log" Enter
tmux attach -t monitor
```

### Parse JSON Logs

```bash
# Pretty-print latest trade
tail -1 logs/trades.log | jq .

# Get all trades for a token
grep "PUMP" logs/trades.log | jq '.message, .positionId, .pnl'

# Get error summary
jq '.message' logs/error.log | sort | uniq -c | sort -rn

# Find trades with losses
jq 'select(.pnl < 0)' logs/trades.log
```

### Performance Analysis

```bash
# Get average win size
jq '.pnl | select(. > 0)' logs/trades.log | \
  awk '{sum+=$1; count++} END {print "Avg win:", sum/count}'

# Get win rate
jq '.pnl' logs/trades.log | \
  awk '{wins+=($1>0); total++} END {print "Win rate:", 100*wins/total "%"}'

# Get trade duration distribution
jq '.duration' logs/trades.log | \
  awk '{sum+=$1; count++} END {print "Avg duration (ms):", sum/count}'
```

---

## Emergency Procedures

### Graceful Shutdown

**Direct process:**
```bash
# Send SIGTERM (graceful)
pkill -TERM -f "node.*daemon.js"

# Or SIGINT
pkill -INT -f "node.*daemon.js"
```

**PM2:**
```bash
# Graceful shutdown
pm2 stop solana-trading-bot

# With timeout
pm2 kill
```

**Systemd:**
```bash
# Graceful stop
sudo systemctl stop solana-bot

# Force stop
sudo systemctl kill -s KILL solana-bot
```

**Docker:**
```bash
# Graceful stop
docker stop solana-bot

# Force stop (if stuck)
docker kill solana-bot
```

**Expected behavior during shutdown:**
1. Bot stops accepting new trades
2. All open positions are closed at market price
3. Final metrics are logged
4. State is saved
5. Process exits cleanly

### Emergency Position Close

If the bot crashes with open positions, you can recover them:

```bash
# Check open positions
cat state/bot-state.json | jq '.openPositions'

# Manually close via command:
# (Requires manual intervention - close via Phantom wallet or CLI)
```

### Emergency Stop Loss

If portfolio loses exceed threshold:

1. Bot automatically triggers emergency close
2. All positions closed immediately
3. Alert sent to Discord/Telegram
4. Bot halts (no new trades)
5. Manual review required before restart

### Recovery from Crash

```bash
# 1. Check last state
cat state/bot-state.json

# 2. Check backups
ls -la state/backups/

# 3. Restore if needed
# Edit stateManager.js and call: restoreFromBackup()

# 4. Restart
npm start
# or
pm2 restart solana-trading-bot
# or
sudo systemctl restart solana-bot
```

---

## Troubleshooting

### Bot won't start

```bash
# Check Node version
node --version  # Should be v22+

# Check dependencies
npm list

# Reinstall if corrupted
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
lsof -i :3000

# Check logs
tail logs/trading.log
tail logs/error.log
```

### High memory usage

```bash
# Check memory in logs
jq '.memory' logs/heartbeat.log | tail -10

# Reduce heap size (edit ecosystem.config.js or systemd service)
NODE_OPTIONS=--max_old_space_size=256

# Restart
pm2 restart solana-trading-bot
```

### No trades executing

```bash
# Check for safeguard triggers
jq '.message' logs/error.log | grep -i safeguard

# Check position limits
cat state/metrics.json | jq '.openPositionsCount'

# Check capital
jq '.portfolio' logs/heartbeat.log | tail -1

# Check sentiment gates
tail -50 logs/sentiment.log
```

### Missed heartbeats

```bash
# Check if bot is running
ps aux | grep daemon

# Check logs for errors
tail -50 logs/error.log

# If hung, restart gracefully
pm2 restart solana-trading-bot --wait-ready

# If still stuck, force restart
pm2 kill
pm2 start ecosystem.config.js
```

### Alerts not sending

```bash
# Check Discord webhook
echo "Test" | curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"embeds":[{"title":"Test","description":"OK"}]}' \
  YOUR_WEBHOOK_URL

# Check Telegram bot
curl https://api.telegram.org/botYOUR_TOKEN/sendMessage \
  -d chat_id=YOUR_CHAT_ID \
  -d text="Test message"

# Check environment variables
env | grep -i discord
env | grep -i telegram

# Check alert queue
jq '.alerts' state/bot-state.json | tail -20
```

### Positions not closing

```bash
# Check exit conditions
jq '.positions' state/bot-state.json | \
  jq '.[] | select(.status == "open")'

# Check position prices
tail logs/trades.log | jq '.exit, .pnl'

# Check for execution errors
grep "exit" logs/error.log
```

---

## Maintenance

### Daily Tasks

- ✅ Check heartbeat logs (every 6 hours)
- ✅ Monitor P&L (daily)
- ✅ Review error logs
- ✅ Check memory usage
- ✅ Verify alerts working

### Weekly Tasks

- ✅ Review trading performance
- ✅ Check backup integrity
- ✅ Update dependencies if needed
- ✅ Verify Solana RPC connectivity
- ✅ Test alert channels

### Monthly Tasks

- ✅ Full system test
- ✅ Clean up old logs (>30 days)
- ✅ Backup state files to external storage
- ✅ Review and update configuration
- ✅ Check for Node.js updates

### State Backups

**Daily automatic backups:**
```bash
# Located in state/backups/
ls -la state/backups/
```

**Manual backup:**
```bash
cp state/bot-state.json state/backups/bot-state-$(date +%Y-%m-%d-%H%M%S).json
```

**List available backups:**
```bash
ls -lht state/backups/ | head -20
```

**Restore from backup:**
```bash
# Edit src/stateManager.js and call restoreFromBackup()
# Or manually copy:
cp state/backups/bot-state-2024-02-11.json state/bot-state.json

# Then restart bot
npm start
```

### Log Rotation

**With PM2:**
```bash
# Configure in ecosystem.config.js
max_size: '100M'
max_file: '10'
```

**With Systemd:**
```bash
# Logs are in journal - auto-rotated
sudo journalctl --vacuum-size=500M
```

**With Docker:**
```bash
# Set in docker-compose.yml
logging:
  driver: 'json-file'
  options:
    max-size: '10m'
    max-file: '5'
```

**Manual rotation:**
```bash
# Archive logs
tar -czf logs-$(date +%Y%m%d).tar.gz logs/

# Clean up
rm logs/*.log
```

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all
npm update

# Check security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Restart bot
npm start
```

### Performance Tuning

**Increase scan interval (slower = lower cost):**
```bash
# Edit config.js
scanIntervalSeconds: 30  // Default 15, can increase to 30-60
```

**Adjust memory allocation:**
```bash
# In ecosystem.config.js or systemd service
NODE_OPTIONS: --max_old_space_size=1024  // Default 512
```

**Reduce logs verbosity (lower disk usage):**
```bash
# Edit config.js
logging.level: 'info'  // Default, can set to 'warn' or 'error'
```

---

## Support & Resources

### Useful Commands Reference

```bash
# Full bot status
cat state/heartbeat.json | jq .

# Portfolio metrics
cat state/metrics.json | jq '.totalPnl, .winRate, .openPositionsCount'

# Open positions count
jq '.positions | length' state/bot-state.json

# Last 10 trades
tail -10 logs/trades.log | jq '.positionId, .entry, .exit, .pnl'

# Error count (last hour)
grep "$(date +%Y-%m-%d\ %H)" logs/error.log | wc -l

# Bot uptime (seconds)
jq '.uptime' logs/heartbeat.log | tail -1

# Memory trend
jq '.memoryUsage.heapUsed' logs/heartbeat.log | tail -20 | jq -s 'min, max, add/length | [floor]'
```

### Getting Help

1. Check logs: `tail -f logs/trading.log logs/error.log`
2. Review metrics: `cat state/metrics.json`
3. Check heartbeat: `cat state/heartbeat.json`
4. Verify configuration: `cat .env` (check values)
5. Test alerts: Manually send test alert to Discord/Telegram

---

## Appendix: System Requirements

**Minimum:**
- CPU: 1 core (2+ recommended)
- RAM: 512MB (1GB recommended)
- Disk: 10GB (for logs/backups)
- Network: Stable internet connection

**Recommended:**
- CPU: 2+ cores
- RAM: 2GB
- Disk: 50GB
- Network: Redundant connection

**Required Services:**
- Solana RPC (mainnet-beta or custom)
- Jupiter API
- Discord/Telegram (for alerts)

---

**Last Updated:** 2024-02-11  
**Version:** 1.0.0  
**Maintainer:** Solana Trading Bot Team
