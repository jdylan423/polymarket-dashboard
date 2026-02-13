# Daemon/Operations Layer Setup Guide

## Overview

The Solana Trading Bot now includes a production-ready daemon/operations layer with:

✅ **src/daemon.js** - Main daemon orchestrator (25KB+)  
✅ **src/alerts.js** - Enhanced notification system  
✅ **src/heartbeat.js** - Health check system  
✅ **src/stateManager.js** - Enhanced with daily backups  
✅ **ecosystem.config.js** - PM2 configuration  
✅ **solana-bot.service** - Systemd service file  
✅ **docker/Dockerfile** - Docker containerization  
✅ **docker/docker-compose.yml** - Docker orchestration  
✅ **docs/OPERATIONS.md** - Complete operations guide  

---

## Quick Integration Checklist

### Step 1: Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in all required API keys and secrets
- [ ] Set risk management parameters
- [ ] Test Solana RPC connection

### Step 2: Install & Test
```bash
npm install
npm start           # Should see startup message
# Ctrl+C to stop gracefully
```

### Step 3: Choose Deployment Method

**Option A: Direct Node.js (Development)**
```bash
npm start
npm run dev       # With watch mode
```

**Option B: PM2 (Production - Recommended)**
```bash
npm install -g pm2
npm run pm2:start
npm run pm2:logs
```

**Option C: Systemd (Linux Server)**
```bash
sudo cp solana-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable solana-bot
sudo systemctl start solana-bot
sudo systemctl status solana-bot
```

**Option D: Docker (Container)**
```bash
npm run docker:build
npm run docker:up
docker logs -f solana-bot
```

---

## Core Components

### 1. Daemon Loop (src/daemon.js)

**What it does:**
- Orchestrates bot as a continuous daemon
- Manages market scanning (10-30s intervals)
- Monitors open positions (10s intervals)
- Records heartbeats (5m intervals)
- Captures metrics snapshots (30m intervals)
- Sends daily summaries (24h intervals)
- Recovers from transient errors automatically
- Handles graceful shutdown

**Key features:**
- Error recovery with exponential backoff
- Memory leak prevention
- Crash detection and auto-recovery
- Performance monitoring
- State persistence after every trade

**Usage:**
```bash
node src/daemon.js
```

**Monitoring:**
```bash
tail -f logs/trading.log
tail -f logs/heartbeat.log
```

### 2. Alert System (src/alerts.js)

**Notification Channels:**
- Discord webhooks (embeds with rich formatting)
- Telegram bots (HTML formatted messages)

**Alert Types:**
- Position opened
- Position closed (with P&L)
- Portfolio metrics (hourly)
- Safeguard triggers (critical)
- Bot errors & warnings
- Daily performance summaries

**Rate Limiting:**
- Position events: 5 seconds
- Metrics: 1 minute
- Safeguards: 30 seconds
- Errors: 30 seconds
- Daily summary: 5 minutes

**Queue System:**
- Buffers up to 100 alerts
- Retries failed deliveries
- Auto-cleanup of old queued items

**Usage:**
```javascript
import alerts from './src/alerts.js';

// Send custom alert
await alerts.alertPositionOpened(position);
await alerts.alertPortfolioMetrics(metrics);
await alerts.alertError('🚨 Critical Error', { details: '...' });

// Check queue
console.log(alerts.getStats());
```

### 3. Heartbeat System (src/heartbeat.js)

**What it records (every 5 minutes):**
- Bot status (alive/dead)
- Uptime and process metrics
- Memory usage (heap, RSS)
- Portfolio snapshot
- Open positions count
- Error count and recovery status

**Health Status Levels:**
```
Healthy: Last beat < 6 min ago
Warning: Last beat 6-10 min ago
Critical: Last beat > 10 min ago
```

**Files:**
- `logs/heartbeat.log` - JSON lines log
- `state/heartbeat.json` - Latest heartbeat

**Usage:**
```bash
# View latest heartbeat
tail -1 logs/heartbeat.log | jq .

# Check health
cat state/heartbeat.json | jq '.portfolio'

# Get stats
node -e "const hb=require('./src/heartbeat.js'); console.log(JSON.stringify(hb.getHeartbeatStats(), null, 2))"
```

### 4. State Management (src/stateManager.js)

**Persistence Features:**
- Auto-save after every trade
- Daily automated backups
- Crash recovery
- Error tracking
- Metrics snapshots

**Files:**
```
state/
├── bot-state.json      # Current state
├── metrics.json        # Portfolio metrics
├── heartbeat.json      # Latest heartbeat
└── backups/
    ├── bot-state-2024-02-11.json
    ├── bot-state-2024-02-10.json
    └── metrics-2024-02-11.json
```

**Backup Management:**
```bash
# List backups
npm run backups:list

# Restore from backup (manual)
cp state/backups/bot-state-2024-02-10.json state/bot-state.json
npm start
```

---

## Deployment Methods

### Method 1: PM2 (Recommended for Production)

**Install:**
```bash
npm install -g pm2
```

**Start:**
```bash
npm run pm2:start    # Uses ecosystem.config.js
```

**Configuration** (ecosystem.config.js):
- App name: `solana-trading-bot`
- Instances: 1 (single instance)
- Max memory: 512M (auto-restart if exceeded)
- Auto-restart: On crash
- Watch mode: Off by default (enable for dev)
- Graceful shutdown: Enabled

**Management:**
```bash
npm run pm2:status                    # Check status
npm run pm2:logs                      # View logs
npm run pm2:restart                   # Restart
npm run pm2:stop                      # Stop gracefully
npm run pm2:delete                    # Remove from PM2
pm2 startup                           # Auto-start on reboot
pm2 save                              # Save current state
```

**Monitor in real-time:**
```bash
pm2 monit
```

### Method 2: Systemd (Linux Only)

**Install:**
```bash
sudo cp solana-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable solana-bot
sudo systemctl start solana-bot
```

**Configuration** (solana-bot.service):
- User: `solana` (change if needed)
- WorkingDirectory: `/opt/solana-trading-bot`
- Restart policy: `on-failure` (5 restarts per 300s)
- Resource limits: 1GB memory, 80% CPU
- Grace period: 30 seconds

**Management:**
```bash
sudo systemctl status solana-bot
sudo systemctl restart solana-bot
sudo systemctl stop solana-bot
sudo journalctl -u solana-bot -f      # View logs
```

### Method 3: Docker

**Build:**
```bash
npm run docker:build
```

**Run:**
```bash
npm run docker:up
```

**Configuration** (docker-compose.yml):
- Image: Built from Dockerfile
- Volumes: logs/, state/ (persistence)
- Restart: `unless-stopped`
- Memory limit: 1GB
- Health check: Every 30 seconds
- Logging: JSON file, auto-rotated

**Management:**
```bash
docker ps                                   # Check running
docker logs -f solana-bot                  # View logs
docker stats solana-bot                    # Resource usage
npm run docker:down                        # Stop & remove
```

### Method 4: Direct Node.js (Development Only)

```bash
node src/daemon.js
```

**Characteristics:**
- Direct control
- Full output visibility
- Easy debugging
- No process manager
- Manual restart required

---

## Monitoring & Operations

### Daily Checks

```bash
# 1. Bot status
npm run pm2:status
# or
sudo systemctl status solana-bot
# or
docker ps

# 2. Latest heartbeat
npm run heartbeat:view

# 3. Portfolio metrics
npm run metrics:view

# 4. Error logs
tail -20 logs/error.log | jq '.message'

# 5. Recent trades
tail -10 logs/trades.log | jq '.pnl'
```

### Real-Time Monitoring

**All in one terminal:**
```bash
# Watch logs + metrics + heartbeat
tail -f logs/trading.log logs/error.log logs/heartbeat.log
```

**Individual monitors:**
```bash
# Terminal 1: General logs
npm run logs

# Terminal 2: Errors only
npm run logs:errors

# Terminal 3: Trades only
npm run logs:trades

# Terminal 4: Heartbeat
npm run logs:heartbeat
```

### Performance Analytics

```bash
# Win rate
jq '.pnl' logs/trades.log | \
  awk '{wins+=($1>0); total++} END {print "Win rate:", 100*wins/total "%"}'

# Average P&L per trade
jq '.pnl' logs/trades.log | \
  awk '{sum+=$1; count++} END {print "Avg P&L:", sum/count}'

# Memory trend
tail -50 logs/heartbeat.log | \
  jq '.memory.heapUsed' | \
  awk '{sum+=$1; count++} END {print "Avg memory:", sum/count "MB"}'
```

---

## Troubleshooting

### Bot Won't Start

```bash
# Check Node version
node --version          # Should be v22+

# Check dependencies
npm list
npm install

# Check logs
tail logs/error.log

# Check config
cat .env | grep SOLANA
```

### High Memory Usage

```bash
# Check current memory
npm run heartbeat:view | jq '.memory'

# Reduce heap (in ecosystem.config.js)
NODE_OPTIONS: --max_old_space_size=256

# Restart
npm run pm2:restart
```

### Missed Alerts

```bash
# Check alert configuration
cat .env | grep DISCORD
cat .env | grep TELEGRAM

# Test Discord
curl -X POST YOUR_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"content":"Test"}'

# Check alert queue
npm run state:view | jq '.alerts'
```

### Positions Not Closing

```bash
# Check exit conditions
npm run state:view | jq '.positions[] | select(.status == "open")'

# Check for errors
grep "exit" logs/error.log

# Check execution logs
tail -50 logs/trades.log | grep -i "close\|exit"
```

---

## Performance Tuning

### Reduce API Calls

```javascript
// In config.js, increase scan interval
scanIntervalSeconds: 30    // Default: 15 seconds
```

### Lower Memory Footprint

```bash
# In ecosystem.config.js
NODE_OPTIONS: --max_old_space_size=256   // Default: 512
```

### Reduce Log Verbosity

```javascript
// In config.js
logging.level: 'warn'      // Default: 'info'
```

### Batch Operations

```javascript
// Daemon already batches:
// - Scan loop: Every 10-30s
// - Position check: Every 10s
// - Alerts: Rate-limited
// - Metrics: Every 30m
```

---

## Scripts Reference

**Starting:**
```bash
npm start                   # Run daemon
npm run dev                 # Watch mode
npm run start:legacy        # Run old bot
npm run pm2:start           # Start with PM2
npm run docker:up           # Run in Docker
```

**Monitoring:**
```bash
npm run pm2:logs
npm run docker:logs
npm run logs                # All logs
npm run logs:trades         # Trades only
npm run logs:errors         # Errors only
npm run logs:heartbeat      # Heartbeat only
```

**Status:**
```bash
npm run state:view          # View bot state
npm run heartbeat:view      # View latest heartbeat
npm run metrics:view        # View metrics
npm run pm2:status          # PM2 status
npm run backups:list        # List state backups
```

**Management:**
```bash
npm run pm2:restart         # Restart with PM2
npm run pm2:stop            # Stop with PM2
npm run docker:down         # Stop Docker containers
```

---

## Integration with Existing Code

The daemon system integrates with your existing modules:

```javascript
// Already integrated in src/daemon.js:
import jupiterData from './jupiterData.js';           // Token screening
import sentimentAnalysis from './sentimentAnalysis.js'; // Sentiment gates
import positionManager from './positionManager.js';   // Position tracking
import tradeExecution from './tradeExecution.js';     // Trade execution
import stateManager from './stateManager.js';         // State persistence
import alerts from './alerts.js';                     // Notifications
import heartbeat from './heartbeat.js';               // Health checks
```

No changes needed to these modules - daemon uses them as-is.

---

## Emergency Procedures

### Graceful Shutdown

**Direct:**
```bash
pkill -TERM -f "node.*daemon.js"
```

**PM2:**
```bash
npm run pm2:stop
```

**Systemd:**
```bash
sudo systemctl stop solana-bot
```

**Docker:**
```bash
docker stop solana-bot
```

### Emergency Close All Positions

If bot crashes with open positions:

```javascript
// Manual intervention needed:
// 1. Check state/bot-state.json for open positions
// 2. Close via Phantom wallet or solana-cli
// 3. Verify state file is updated
// 4. Restart bot
```

### Force Stop (if hung)

```bash
pm2 kill              # Kill PM2
sudo killall node     # Kill all Node processes
docker kill solana-bot  # Force kill container
```

---

## Support

For detailed operations procedures, see **docs/OPERATIONS.md**

---

**Version:** 1.0.0  
**Last Updated:** 2024-02-11  
**Status:** Production Ready ✅
