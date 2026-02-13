# Dashboard Quick Start

## Start the Dashboard

```bash
npm run dashboard
# or
npm run monitor
```

## What You See

```
╔════════════════════════════════════════════════════════════════════╗
║              SOLANA TRADING BOT - LIVE DASHBOARD                  ║
╠════════════════════════════════════════════════════════════════════╣
║ Status: ✓ RUNNING  │  Uptime: 2h 34m  │  Scans: 459              ║
╠════════════════════════════════════════════════════════════════════╣
║ PORTFOLIO                          │  RISK STATUS                  ║
║ Total P&L:    +0.42 SOL (+21%)     │  Capital Used: 3/4 positions │
║ Realized:     +0.15 SOL            │  Safeguards: ✓ Active        ║
║ Unrealized:   +0.27 SOL            │  Health: ✓ GOOD              ║
║ Win Rate:     66.7% (4W/2L)        │  Daily P&L: -0.05 SOL        ║
╠════════════════════════════════════════════════════════════════════╣
║ OPEN POSITIONS
║ TOKEN     ENTRY    CURRENT   P&L       %      TIME HELD
║ BONK      0.0023   0.0026    +0.15S    +30.4%  1h 22m
║ WIF       2.15     2.10      -0.03S    -2.3%   45m
║ ORCA      8.50     8.75      +0.12S    +2.9%   28m
╠════════════════════════════════════════════════════════════════════╣
║ RECENT ALERTS
║ [00:01] ✓ Position opened: BONK (0.5 SOL @ 0.0023)
║ [23:58] ⚠ Sentiment check failed for SHIB (API timeout)
║ [23:55] ✓ Heartbeat - 2 positions open, +0.27 SOL unrealized
║ [23:50] ✓ Position closed: COPE (TP +30.1%)
║ [23:45] ✓ Heartbeat - Portfolio health: GOOD
╠════════════════════════════════════════════════════════════════════╣
║ Commands: [q]uit  [r]efresh  [s]entiment  [p]ositions  [h]elp      ║
╚════════════════════════════════════════════════════════════════════╝
```

## Commands (Press While Running)

| Key | Action |
|-----|--------|
| **q** | Quit / Exit dashboard |
| **r** | Refresh data immediately |
| **s** | Show sentiment analysis |
| **p** | Show detailed positions |
| **h** | Show help / command list |

## Reading the Dashboard

### Status Line
- **Running (✓)** - Bot is active
- **Stopped (✗)** - Bot is not active
- **Uptime** - How long bot has been running

### Portfolio Metrics (Left)
- **Total P&L** - Profit/loss in SOL and percentage
- **Realized** - P&L from closed trades
- **Unrealized** - P&L from open positions
- **Win Rate** - % of trades that closed in profit

### Risk Status (Right)
- **Capital Used** - X/4 positions (how many filled)
- **Safeguards** - ✓ Active or ✗ Triggered
- **Health** - ✓ GOOD, ⚠ WARNING, or ✗ CRITICAL
- **Daily P&L** - Profit/loss for today

### Open Positions Table
Shows all active positions:
- **TOKEN** - Token symbol (BONK, WIF, etc.)
- **ENTRY** - Price when position opened
- **CURRENT** - Current price right now
- **P&L** - Profit/loss in SOL
- **%** - Profit/loss percentage
- **TIME HELD** - How long position has been open

**Color:** Green = profit, Red = loss

### Recent Alerts
Last 5 events with timestamps:
- ✓ = Success (position opened, closed, heartbeat)
- ⚠ = Warning (slow, API issue)
- ✗ = Error (trade failed, check failed)

## Running with Daemon

**Terminal 1:**
```bash
npm start
```

**Terminal 2:**
```bash
npm run dashboard
```

Both can run simultaneously. Dashboard shows real-time data from daemon.

## Key Features

✅ **Real-time Updates** - Every 5 seconds automatically  
✅ **Color Coded** - Green for gains, red for losses  
✅ **No Dependencies** - Pure Node.js, no external packages  
✅ **Terminal Friendly** - Works over SSH, tmux, screen  
✅ **Interactive** - Live commands while monitoring  
✅ **Responsive** - Shows position updates instantly  

## Color Guide

| Color | Meaning |
|-------|---------|
| 🟢 Green | Profit / Gain / Positive |
| 🔴 Red | Loss / Negative |
| 🟡 Yellow | Neutral / Warning |
| ⚪ White | Normal text |

## Example: First Run

```bash
$ npm run dashboard

Starting Solana Trading Bot Dashboard...

[Dashboard renders...]

1. Check top: Status shows ✓ RUNNING (good!)
2. Check metrics: Portfolio shows current P&L
3. Check positions: See all open trades
4. Check alerts: See recent activity
5. Press 'p' to see detailed position breakdown
6. Press 'q' to quit
```

## Troubleshooting

**Dashboard shows no data?**
- Make sure daemon is running (`npm start`)
- Wait a few seconds for data to populate

**Can't type commands?**
- Terminal needs to support raw input
- Try different terminal emulator

**Display looks garbled?**
- Increase terminal size to 80x24 minimum
- Check terminal encoding is UTF-8

**Updates not happening?**
- Check logs with `npm run logs`
- Verify daemon is still running
- Restart with `npm run dashboard`

## Next Steps

For more details:
- See `docs/DASHBOARD.md` for comprehensive guide
- See `docs/OPERATIONS.md` for daemon operations
- Use `npm run logs` to view detailed logs

---

**Quick Commands:**
```bash
npm start              # Start daemon
npm run dashboard      # Start dashboard
npm run logs           # View logs
npm run metrics:view   # View metrics JSON
npm run state:view     # View bot state
```

Enjoy monitoring your bot! 🚀
