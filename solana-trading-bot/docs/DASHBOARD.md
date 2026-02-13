# Terminal Dashboard User Guide

## Overview

The Terminal User Interface (TUI) Dashboard provides real-time monitoring of the Solana Trading Bot without external dependencies. Perfect for server environments, SSH sessions, or local development.

**Start the dashboard:**
```bash
npm run dashboard
# or
npm run monitor
# or
node src/dashboard.js
```

---

## Display Layout

The dashboard is organized in sections, updating every 5 seconds:

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
║ RECENT ALERTS (Last 5 events)
║ [00:01] ✓ Position opened: BONK (0.5 SOL @ 0.0023)
║ [23:58] ⚠ Sentiment check failed for SHIB (API timeout)
║ [23:55] ✓ Heartbeat - 2 positions open, +0.27 SOL unrealized
║ [23:50] ✓ Position closed: COPE (TP +30.1%)
║ [23:45] ✓ Heartbeat - Portfolio health: GOOD
╠════════════════════════════════════════════════════════════════════╣
║ Commands: [q]uit  [r]efresh  [s]entiment  [p]ositions  [h]elp      ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## Section Breakdown

### Status Bar
Located at the top, shows:
- **Status:** Running (✓) or Stopped (✗)
- **Uptime:** Time bot has been running (e.g., 2h 34m)
- **Scans:** Number of market scans performed

**Indicator Meanings:**
- ✓ RUNNING - Bot is active and monitoring
- ✗ STOPPED - Bot is not running
- Uptime resets on bot restart
- Scans count increases with each market scan cycle

### Portfolio Metrics (Left Column)
Shows financial performance:

**Total P&L**
- Net profit/loss in SOL
- Percentage return on starting capital
- Color-coded: Green (+), Red (-), Yellow (0)

**Realized P&L**
- Profit/loss from closed positions only
- Doesn't include open positions

**Unrealized P&L**
- Current profit/loss from open positions
- Total P&L = Realized + Unrealized

**Win Rate**
- Percentage of trades that closed in profit
- Shows total closed trades in parentheses
- Example: 66.7% (4W/2L) = 4 wins, 2 losses

### Risk Status (Right Column)
Shows current risk management state:

**Capital Used**
- Number of open positions vs maximum allowed
- Example: 3/4 means 3 of 4 max positions filled
- High usage indicates limited trading capacity

**Safeguards**
- ✓ Active = All safeguards enabled and healthy
- ✗ Triggered = One or more safeguards activated
- ⚠ Warning = Approaching limits

**Health**
- ✓ GOOD = All systems normal
- ⚠ WARNING = Monitor closely (high memory, many errors, etc.)
- ✗ CRITICAL = Requires immediate attention

**Daily P&L**
- Profit/loss for current day only
- Resets at midnight
- Color-coded: Green (+), Red (-)

### Open Positions Table
Shows all active positions with columns:

| Column | Meaning | Example |
|--------|---------|---------|
| TOKEN | Token symbol | BONK |
| ENTRY | Entry price in SOL | 0.0023 |
| CURRENT | Current price in SOL | 0.0026 |
| P&L | Unrealized P&L in SOL | +0.15S |
| % | Unrealized P&L percentage | +30.4% |
| TIME HELD | Duration position open | 1h 22m |

**Color Coding:**
- Green: P&L is positive (profit)
- Red: P&L is negative (loss)
- Yellow: P&L is zero (break-even)

**Sorting:**
- Positions displayed in order of opening (oldest first)
- Up to 3 positions shown (scroll to see more in detailed view)

### Recent Alerts
Shows last 5 events from logs:

**Alert Format:**
```
[HH:MM] EMOJI MESSAGE
```

**Emoji Meanings:**
- ✓ Success (position opened/closed, heartbeat, etc.)
- ⚠ Warning (slow scan, API issues, etc.)
- ✗ Error (trade failed, sentiment check failed, etc.)

**Alert Types:**
- Position events (opened, closed with reason)
- Heartbeat (bot still alive)
- Errors and warnings
- System events

---

## Interactive Commands

Press these keys while dashboard is running:

### q - Quit
- Exits dashboard gracefully
- Returns to terminal prompt
- Bot continues running in background

**Example:**
```
Press 'q' → Dashboard closes → Terminal ready for next command
```

### r - Refresh
- Forces immediate data refresh (doesn't wait 5 seconds)
- Useful when you need fresh data immediately
- Automatic refresh still occurs every 5 seconds

**Use When:**
- You just placed a trade and want to see it
- Position prices seem stale
- You want to verify recent activity

### s - Sentiment
Shows sentiment analysis for monitored tokens:

**Display includes:**
- Sentiment score (0.0 = negative, 1.0 = positive)
- Trending score
- Social media metrics (Twitter mentions, Discord members)
- Engagement trends

**Example:**
```
Token: BONK
  Sentiment Score: 0.72 (Positive)
  Trending Score: 0.68 (Strong Trend)
  Twitter: +85 mentions, +12% growth
  Discord: 4.2K members, 150 online
```

**Interpretation:**
- 0.7+ = Strong buy signal
- 0.5-0.7 = Neutral to positive
- 0.3-0.5 = Neutral
- <0.3 = Weak or negative

### p - Positions
Shows detailed breakdown of all open positions:

**For Each Position:**
- Entry price and time
- Current price and P&L
- Position size in SOL and tokens
- Stop loss and take profit levels
- Distance to stop loss (% away)
- Status and risk level

**Example:**
```
Position 1: BONK
  Entry: 0.0023 SOL (1 hour 22 minutes ago)
  Current: 0.0026 SOL
  Size: 0.5 SOL (217.39 tokens)
  P&L: +0.15 SOL (+30.4%)
  Stop Loss: 0.00184 (-20%)
  Take Profit: 0.00299 (+30%)
  Status: ✓ Active, 47.6% away from SL
```

**Status Meanings:**
- ✓ Active = Position normal, healthy distance from SL
- ⚠ Watch = Position approaching SL or TP
- ✗ Risk = Position at high risk, near SL

### h - Help
Shows command reference with descriptions:

```
q - Quit: Exit the dashboard and return to terminal
r - Refresh: Force refresh of all data (auto-refreshes every 5s)
s - Sentiment: Show sentiment analysis for monitored tokens
p - Positions: Show detailed breakdown of open positions
h - Help: Display this command reference

Dashboard automatically updates every 5 seconds.
All values pulled from state/ directory (real-time from bot).
```

---

## Data Sources

The dashboard pulls data from these files (updated in real-time by the daemon):

### state/bot-state.json
- Current session information
- Position states
- Error tracking

### state/metrics.json
- Portfolio metrics
- Win rate and trade counts
- P&L snapshots

### state/heartbeat.json
- Latest heartbeat
- Bot status
- Memory usage
- Uptime

### logs/trading.log
- Recent events
- Alerts and notifications
- Error messages

All files updated automatically by the daemon. Dashboard reads them every 5 seconds (or on demand with 'r').

---

## Keyboard Shortcuts

| Key | Command | Action |
|-----|---------|--------|
| q | Quit | Exit dashboard |
| r | Refresh | Force data refresh |
| s | Sentiment | Show sentiment data |
| p | Positions | Show position details |
| h | Help | Show command help |
| Ctrl+C | Interrupt | Emergency exit |

---

## Auto-Refresh Behavior

**Default:** Every 5 seconds

**Refresh Cycle:**
1. Read state files
2. Parse recent logs
3. Render dashboard
4. Wait 5 seconds
5. Repeat

**To change interval** (edit src/dashboard.js):
```javascript
this.refreshInterval = 5000;  // Change to desired milliseconds
```

---

## Terminal Requirements

### Minimum Size
- Width: 64 characters (recommended 80+)
- Height: 24 lines (recommended 30+)

### Supported Terminals
- macOS: Terminal, iTerm2, kitty
- Linux: xterm, gnome-terminal, konsole, tilix
- Windows: Windows Terminal, WSL, Git Bash
- Remote: SSH, tmux, screen

### Terminal Customization
**Change background color:**
```bash
# Most terminals support 256 colors
# Dashboard auto-detects and uses available colors
```

**For SSH Sessions:**
```bash
# Ensure TERM env var is set correctly
export TERM=xterm-256color
npm run dashboard
```

---

## Color Scheme

| Element | Positive | Negative | Neutral |
|---------|----------|----------|---------|
| P&L Values | Green (32m) | Red (31m) | Yellow (33m) |
| Text | Default | Default | Default |
| Background | Terminal default | Terminal default | Terminal default |

**Note:** Colors adjust automatically based on terminal capabilities. Monochrome terminals will still display correctly.

---

## Advanced Usage

### Running Alongside Daemon

**Terminal 1 (Daemon):**
```bash
npm start
```

**Terminal 2 (Dashboard):**
```bash
npm run dashboard
```

Both run simultaneously. Daemon logs to files, dashboard reads from them.

### In tmux Session

```bash
# Create tmux session with two panes
tmux new-session -d -s bot -x 160 -y 40

# Pane 0: Run daemon
tmux send-keys -t bot:0 'npm start' Enter

# Pane 1: Run dashboard
tmux split-window -h
tmux send-keys -t bot:1 'npm run dashboard' Enter

# View both
tmux attach -t bot
```

### In Screen Session

```bash
# Create screen session
screen -S solana-bot -X screen bash

# In first window
npm start

# In second window (Ctrl+A, then C)
npm run dashboard
```

### Redirect to File

```bash
# Log dashboard output to file
npm run dashboard > dashboard.log 2>&1 &

# View in real-time
tail -f dashboard.log
```

---

## Troubleshooting

### Dashboard Shows "No recent alerts"
- **Cause:** Bot just started or no activity yet
- **Fix:** Run `npm run dashboard` after bot has been running for a bit
- **Check:** Verify logs/ directory exists and has content

### Bot State Shows No Data
- **Cause:** State files not created yet
- **Fix:** Wait for daemon to write state (happens after first trade or heartbeat)
- **Alternative:** Check with `npm run state:view`

### Terminal Display Issues
- **Cause:** Terminal too small or doesn't support colors
- **Fix:** Resize terminal to 80x24 minimum
- **Alternative:** Check terminal color support with `echo $TERM`

### Positions Not Updating
- **Cause:** Daemon not running or state files not being written
- **Fix:** Start daemon with `npm start` in another terminal
- **Check:** `ls -la state/` to verify files exist and are recent

### Commands Not Responding
- **Cause:** Terminal not in raw mode or stdin issues
- **Fix:** Try pressing Ctrl+C to exit and restart
- **Alternative:** If SSH, ensure terminal forwarding enabled

---

## Performance Tips

1. **Large terminals** (120+ columns) = better layout
2. **Dark background** = better color visibility
3. **Fixed-width font** = better alignment
4. **Modern terminal emulator** = better rendering speed

---

## Example Workflows

### Monitor During Trading
```bash
# Terminal 1: Start daemon
npm start

# Terminal 2: Watch dashboard
npm run dashboard

# When trade triggers, dashboard updates automatically
# Press 'p' to see detailed position info
```

### Check Sentiment Before Entry
```bash
# Run dashboard
npm run dashboard

# Wait for market scan
# Press 's' to review sentiment scores
# Decide if entry is appropriate
```

### Analyze P&L
```bash
# Run dashboard
npm run dashboard

# View portfolio metrics
# Press 'p' to see detailed position breakdown
# Track win rate and average P&L
```

### Emergency Monitoring
```bash
# SSH into server
ssh user@server

# Run dashboard
npm run dashboard

# Monitor bot health from anywhere
# Check status, portfolio, risks in real-time
```

---

## Dashboard Updates

The dashboard displays updates every 5 seconds automatically. No manual action needed:

1. **Automatic scanning** happens in background
2. **Positions update** as prices change
3. **Alerts populate** as events occur
4. **Metrics refresh** every heartbeat

Press 'r' to force immediate refresh if needed.

---

## Tips & Tricks

### Maximize Screen Space
```bash
# Maximize terminal window before starting
# Use fullscreen mode in terminal
# Disable menu bar/status bar if possible
```

### Quick Status Check
```bash
# In background terminal, start daemon
npm start &

# In another, quick status check
npm run state:view | jq '.portfolio'
```

### Monitor Multiple Bots
```bash
# Terminal 1: Bot A
npm start

# Terminal 2: Bot B
npm start

# Terminal 3: Dashboard (shows whichever finished most recent trade)
npm run dashboard
```

### Automate with Cron
```bash
# Send status to Discord every hour
0 * * * * npm run metrics:view | curl -X POST ...
```

---

## Keyboard Combinations

| Combination | Action |
|-------------|--------|
| Ctrl+C | Force quit (emergency) |
| Ctrl+Z | Pause dashboard (background) |
| q | Graceful quit |
| r | Refresh data |

---

## Related Commands

```bash
npm start              # Start daemon
npm run logs           # View all logs
npm run logs:trades    # View trade logs
npm run logs:errors    # View error logs
npm run logs:heartbeat # View heartbeat logs
npm run metrics:view   # View metrics JSON
npm run state:view     # View bot state JSON
npm run heartbeat:view # View latest heartbeat
npm run dashboard      # Start dashboard (this guide)
```

---

## FAQ

**Q: Can I run multiple dashboards?**
A: Yes, multiple dashboards can read the same state files simultaneously.

**Q: Does dashboard affect bot performance?**
A: No, dashboard only reads files. Minimal impact.

**Q: Can I customize colors?**
A: Edit src/dashboard.js, modify color codes in getColor() method.

**Q: Does dashboard work over SSH?**
A: Yes, works over any terminal connection that supports text I/O.

**Q: How do I save dashboard output?**
A: Use tmux capture-pane or redirect stdout to file.

**Q: Can I pause/resume dashboard?**
A: Yes, press Ctrl+Z to pause, `fg` to resume.

---

## Support

For issues with dashboard:
1. Check terminal size is 80x24 minimum
2. Verify state/ directory has recent files
3. Run `npm run state:view` to check bot state
4. Check logs/ directory for error messages
5. Restart dashboard: quit with 'q', start again

---

**Version:** 1.0.0  
**Last Updated:** 2024-02-11  
**Compatibility:** Node.js 22+
