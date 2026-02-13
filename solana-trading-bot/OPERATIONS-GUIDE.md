# 📊 Operations & Monitoring Guide

Complete guide for operating the Solana trading bot daemon in production.

---

## Daily Operations

### Morning Routine (5 minutes)

1. **Check Bot Status**
   ```bash
   # PM2
   pm2 status
   
   # Systemd
   sudo systemctl status solana-bot
   
   # Docker
   docker-compose ps
   ```

2. **Review Last 24 Hours**
   ```bash
   # View yesterday's trades
   tail -100 logs/trading.log | grep -i "position closed"
   
   # Check daily P&L
   cat state/metrics.json | jq '.totalPnl'
   ```

3. **Verify Open Positions**
   ```bash
   cat data/positions.json | jq '.[] | select(.status=="open") | {symbol: .tokenSymbol, entry: .entryPrice, current: .currentPrice, pnl: .pnlPercent}'
   ```

4. **Check for Errors**
   ```bash
   tail -20 logs/error.log
   ```

### Ongoing Monitoring (Throughout Day)

**Monitor every 1-2 hours:**

1. **Heartbeat Check** (should update every 5 minutes)
   ```bash
   cat state/heartbeat.json | jq '.timestamp'
   
   # Check uptime
   cat state/heartbeat.json | jq '.uptime'
   
   # Check memory
   cat state/heartbeat.json | jq '.memory'
   ```

2. **Watch for Alerts**
   - Discord notifications
   - Telegram notifications
   - Bot status messages

3. **Monitor Resource Usage**
   ```bash
   # PM2
   pm2 monit
   
   # Systemd
   watch -n 5 'systemctl show solana-bot -p MemoryCurrent,CPUUsageNSec'
   
   # Docker
   docker stats solana-bot
   ```

### End of Day (5 minutes)

1. **Daily Summary Alert**
   - Bot automatically sends at 24:00
   - Review in Discord/Telegram

2. **Save Daily Backup**
   ```bash
   cp state/metrics.json backup/metrics-$(date +%Y%m%d).json
   ```

3. **Check for Issues**
   - Any restart triggers?
   - Any safeguard activations?
   - Any API failures?

---

## Monitoring Dashboards

### Real-Time Log Monitoring

**Terminal 1 - Main Activity:**
```bash
tail -f logs/trading.log | grep -E "Trade|Position|Alert"
```

**Terminal 2 - Heartbeat:**
```bash
watch -n 60 'cat state/heartbeat.json | jq .'
```

**Terminal 3 - PM2 Stats:**
```bash
pm2 monit
```

### State Files to Monitor

| File | Update Interval | Purpose |
|------|-----------------|---------|
| `state/heartbeat.json` | Every 5 min | Proof of life |
| `state/metrics.json` | Every 30 min | Performance snapshot |
| `state/bot-state.json` | On each action | Session state |
| `data/positions.json` | On each trade | Trade history |

---

## Key Metrics to Track

### Portfolio Metrics
```bash
# View all metrics
cat state/metrics.json | jq .

# Extract specific metrics
TOTAL_PNL=$(cat state/metrics.json | jq '.totalPnl')
WIN_RATE=$(cat state/metrics.json | jq '.winRate')
OPEN_POS=$(cat state/metrics.json | jq '.openPositionsCount')

echo "Total P&L: $TOTAL_PNL SOL"
echo "Win Rate: $WIN_RATE%"
echo "Open Positions: $OPEN_POS"
```

### Daily Performance
```bash
# Trades in last 24 hours
cat data/positions.json | jq '[.[] | select(.status=="closed") | select(.exitTime > (now | . * 1000 - 86400000))]' | jq 'length'

# Daily P&L
cat data/positions.json | jq '[.[] | select(.status=="closed") | select(.exitTime > (now | . * 1000 - 86400000))]' | jq 'map(.pnl) | add'

# Win rate today
TOTAL=$(cat data/positions.json | jq '[.[] | select(.status=="closed") | select(.exitTime > (now | . * 1000 - 86400000))]' | jq 'length')
WINS=$(cat data/positions.json | jq '[.[] | select(.status=="closed") | select(.pnl > 0) | select(.exitTime > (now | . * 1000 - 86400000))]' | jq 'length')
```

### System Health
```bash
# Uptime
cat state/heartbeat.json | jq '.uptime'

# Memory usage (MB)
cat state/heartbeat.json | jq '.memory.heapUsed'

# Restart count
cat state/bot-state.json | jq '.restartCount'

# Error count
cat state/bot-state.json | jq '.errorCount'
```

---

## Alert Types & Response

### Alert: Position Opened 🎯

**Expected**: Normal, indicates trading signal found  
**Action**: Monitor the position

```bash
# View the open position
cat data/positions.json | jq '.[] | select(.status=="open")'
```

### Alert: Position Closed 📊

**Expected**: Normal, trade exited  
**Action**: Review exit reason

```bash
# View the closed trade
LAST_TRADE=$(cat data/positions.json | jq '.[-1]')
echo "Exit Reason: $(echo $LAST_TRADE | jq '.exitReason')"
echo "P&L: $(echo $LAST_TRADE | jq '.pnlPercent')%"
```

### Alert: Portfolio Update 📈

**Expected**: Normal, every 2 hours  
**Action**: Review portfolio health

```bash
cat state/metrics.json | jq '{totalPnl, totalPnlPercent, openPositions: .openPositionsCount, winRate}'
```

### Alert: Safeguard Triggered 🚨

**Expected**: Rare, indicates critical condition  
**Action**: Review immediately

#### Type 1: Portfolio Stop Loss
```bash
# Check what happened
tail -50 logs/error.log | grep "PORTFOLIO"

# Review positions
cat data/positions.json | jq '.[] | select(.status=="closed") | {token: .tokenSymbol, pnl}'
```

#### Type 2: Daily Loss Limit
```bash
# Check today's P&L
DAILY_PNL=$(cat data/positions.json | jq '[.[] | select(.status=="closed") | select(.exitTime > (now - 86400))]' | jq 'map(.pnl) | add')
echo "Daily P&L: $DAILY_PNL"
```

**Response**: Wait 24 hours or manually restart bot after review

### Alert: Bot Error ⚠️

**Expected**: Rare, indicates API/network issue  
**Action**: Check logs and diagnose

```bash
# View recent errors
tail -50 logs/error.log

# Check for patterns
grep "API\|Network\|Timeout" logs/error.log | tail -10
```

**Common causes:**
- Jupiter API down → Bot will retry automatically
- Network connectivity → Check internet
- RPC endpoint timeout → Check RPC_ENDPOINT in .env
- Wallet issue → Check WALLET_PRIVATE_KEY

### Alert: Daily Summary 📅

**Expected**: Normal, once per 24 hours  
**Action**: Review performance

```bash
# Manually check summary
cat state/metrics.json | jq '{trades: .closedPositionsCount, wins: .winningTrades, losses: .losingTrades, winRate, totalPnl}'
```

---

## Troubleshooting Guide

### Issue: No Alerts Received

**Check Discord webhook:**
```bash
# Test webhook
curl -X POST "$DISCORD_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message"}'
```

**Check Telegram bot:**
```bash
# Verify bot token
TELEGRAM_TOKEN="your_token"
curl "https://api.telegram.org/bot${TELEGRAM_TOKEN}/getMe"
```

**Solution**: Update API keys in .env and restart bot

### Issue: Bot Not Trading

**Check logs:**
```bash
tail -100 logs/trading.log | grep "scanning\|opportunity\|failed"
```

**Common causes:**
1. **No momentum tokens found** → Market conditions
2. **Sentiment gates failing** → Lower `MINIMUM_SENTIMENT_SCORE` in .env
3. **Technical filters too strict** → Adjust in .env
4. **Position limit reached** → Wait for positions to close
5. **Portfolio stop loss triggered** → Review and restart

**Debug steps:**
```bash
# Check token screening
grep "Token screening complete" logs/trading.log | tail -1

# Check sentiment analysis
grep "Sentiment Analysis" logs/sentiment.log | tail -5

# Check for safeguard triggers
grep "safeguard\|stop loss\|kill switch" logs/trading.log
```

### Issue: High Memory Usage

**Check memory:**
```bash
cat state/heartbeat.json | jq '.memory'
```

**If > 512MB:**
1. Increase memory limit in deployment config
2. Clear old logs: `rm logs/*.log*`
3. Reduce `MAX_POSITION_SIZE_SOL` to reduce data

**Systemd memory limit:**
```bash
# Edit service file
sudo nano /etc/systemd/system/solana-bot.service

# Update line:
# MemoryMax=2G

# Reload
sudo systemctl daemon-reload
```

### Issue: Frequent Restarts

**Check restart count:**
```bash
cat state/bot-state.json | jq '.restartCount'
```

**Review errors:**
```bash
tail -200 logs/error.log | head -100
```

**Most common:**
1. **Private key invalid** → Check WALLET_PRIVATE_KEY
2. **RPC endpoint down** → Change RPC_ENDPOINT
3. **Out of memory** → Increase memory limit
4. **Configuration error** → Run `npm test`

### Issue: Positions Not Closing

**Check exit conditions:**
```bash
# View open position
OPEN=$(cat data/positions.json | jq '.[] | select(.status=="open")')

# Check price
echo $OPEN | jq '{token: .tokenSymbol, entry: .entryPrice, current: .currentPrice, stopLoss: .stopLossPrice, takeProfit: .takeProfitPrice}'

# Should close if:
# current <= stopLoss OR current >= takeProfit
```

**If not closing:**
1. Check logs for price update errors
2. Verify RPC connection
3. Check position update frequency

---

## Maintenance Tasks

### Weekly (1 hour)

1. **Review Performance**
   ```bash
   cat state/metrics.json | jq .
   ```

2. **Check Logs**
   ```bash
   # Summary of week
   grep "Trade Executed" logs/trades.log | wc -l
   grep "ERROR" logs/error.log | wc -l
   ```

3. **Backup Data**
   ```bash
   cp -r data backup/data-$(date +%Y%m%d)
   cp -r state backup/state-$(date +%Y%m%d)
   ```

4. **Review Alerts**
   - Any unexpected patterns?
   - Any repeated errors?

### Monthly (2 hours)

1. **Analyze Performance**
   ```bash
   # Best trading days
   cat data/positions.json | jq '[.[] | select(.status=="closed")] | group_by(.exitTime / 86400000 | floor) | map({date: .[0].exitTime, pnl: map(.pnl) | add})'
   
   # Best performing tokens
   cat data/positions.json | jq '[.[] | select(.status=="closed")] | group_by(.tokenSymbol) | map({token: .[0].tokenSymbol, trades: length, pnl: map(.pnl) | add, winRate: (map(select(.pnl > 0)) | length / length * 100)})'
   ```

2. **Adjust Strategy**
   - Are safeguards triggering too often?
   - Are win rates declining?
   - Should we adjust risk parameters?

3. **Update Configuration**
   ```bash
   # Review and update .env if needed
   nano .env
   
   # Test changes in PM2 dev environment
   pm2 start ecosystem.config.js --name "solana-bot-dev" -- --dry-run
   ```

4. **Clean Logs** (Optional)
   ```bash
   # Keep only last 30 days
   find logs -name "*.log*" -mtime +30 -delete
   ```

---

## Scaling & Optimization

### Increase Position Size

**Current**: 0.5 SOL max per position

**To increase:**
```bash
# Update in .env
MAX_POSITION_SIZE_SOL=1.0

# Restart
pm2 restart solana-trading-bot

# Verify
grep MAX_POSITION logs/trading.log
```

### Increase Scan Frequency

**Current**: 30 seconds

**To increase frequency:**
```bash
# Faster scanning = higher trading volume
SCAN_INTERVAL_SECONDS=15

# Restart
pm2 restart solana-trading-bot
```

### Add More Simultaneous Positions

**Current**: 4 positions max

**To increase:**
```bash
# More positions = higher capital utilization
MAX_SIMULTANEOUS_POSITIONS=8

# Adjust capital limit
STARTING_CAPITAL_SOL=4  # Double capital

# Restart
pm2 restart solana-trading-bot
```

---

## Emergency Procedures

### Emergency Stop

**Immediately stop the bot:**
```bash
# PM2
pm2 stop solana-trading-bot

# Systemd
sudo systemctl stop solana-bot

# Docker
docker-compose stop
```

Positions will be closed gracefully.

### Manual Position Close

**If bot crashes and positions open:**
```bash
# Edit positions.json
nano data/positions.json

# Find open positions and manually set:
# "status": "closed"
# "exitPrice": <current_price>
# "exitTime": <current_timestamp>
# "exitReason": "manual_emergency_close"

# Or use the API (future feature)
```

### Restart After Emergency

```bash
# Clear error state
rm state/bot-state.json

# Restart
pm2 start ecosystem.config.js

# Monitor closely
pm2 logs solana-trading-bot
```

---

## Monitoring Automation

### Setup Cron Job (Linux)

```bash
# Edit crontab
crontab -e

# Add health check every 5 minutes
*/5 * * * * /opt/solana-trading-bot/scripts/health-check.sh

# Add hourly metrics export
0 * * * * cp /opt/solana-trading-bot/state/metrics.json /var/log/solana-bot/metrics-$(date +\%Y\%m\%d-\%H\%M).json

# Add daily backup
0 2 * * * tar -czf /backup/solana-bot-$(date +\%Y\%m\%d).tar.gz /opt/solana-trading-bot/{data,state}
```

### Create Health Check Script

```bash
#!/bin/bash
# scripts/health-check.sh

HEARTBEAT_FILE="/opt/solana-trading-bot/state/heartbeat.json"
LAST_UPDATE=$(stat -f%m "$HEARTBEAT_FILE" 2>/dev/null || stat -c%Y "$HEARTBEAT_FILE")
NOW=$(date +%s)
DIFF=$((NOW - LAST_UPDATE))

if [ $DIFF -gt 600 ]; then  # 10 minutes
  echo "Bot unhealthy: No heartbeat for $DIFF seconds"
  # Send alert
  curl -X POST "$DISCORD_WEBHOOK" -d '{"content":"⚠️ Bot heartbeat missing!"}'
  # Restart
  systemctl restart solana-bot
fi
```

---

## Performance Tuning

### Optimize RPC Endpoint

```bash
# Test different RPCs
for rpc in "https://api.mainnet-beta.solana.com" "https://api.rpcpool.com"; do
  echo "Testing $rpc"
  curl -s "$rpc" | jq . | grep -q "result" && echo "✓ Working" || echo "✗ Failed"
done
```

### Reduce API Calls

```bash
# Increase scan interval to reduce load
SCAN_INTERVAL_SECONDS=60

# Reduce position check frequency
# (modify src/bot-daemon.js if needed)
```

### Monitor Network Latency

```bash
# Watch RPC response times
tail -f logs/trading.log | grep "ms)"
```

---

## Backup & Recovery

### Daily Backup

```bash
#!/bin/bash
BACKUP_DIR="/backup/solana-bot-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

cp -r /opt/solana-trading-bot/data "$BACKUP_DIR/"
cp -r /opt/solana-trading-bot/state "$BACKUP_DIR/"
cp /opt/solana-trading-bot/.env "$BACKUP_DIR/.env"

# Keep last 30 days
find /backup -name "solana-bot-*" -mtime +30 -exec rm -rf {} \;
```

### Recovery

```bash
# Restore from backup
cp -r backup/solana-bot-20250210/data /opt/solana-trading-bot/
cp -r backup/solana-bot-20250210/state /opt/solana-trading-bot/

# Restart bot
systemctl restart solana-bot
```

---

## Key Takeaways

✅ **Monitor heartbeat** every 5-10 minutes  
✅ **Review P&L** every 24 hours  
✅ **Check errors** when bot behaves unexpectedly  
✅ **Backup data** at least weekly  
✅ **Test changes** in dry-run mode first  
✅ **Respond quickly** to safeguard triggers  

**Keep the bot healthy and it keeps your trades flowing!** 📊

---

**Last Updated**: 2025-02-10  
**Version**: 1.0.0
