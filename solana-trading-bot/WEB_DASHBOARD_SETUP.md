# Web Dashboard Setup Guide

## Overview

A modern, responsive React web dashboard for real-time monitoring of the Solana Trading Bot. Access it from any browser on your network.

**Features:**
- 📊 Real-time portfolio metrics
- 📈 Live P&L charts and trends
- 💼 Open/closed positions tracking
- 🎯 Sentiment analysis overview
- 🚨 Risk management monitoring
- 📢 Live alerts feed
- 🎨 Dark mode design
- 📱 Fully responsive (desktop, tablet, mobile)

---

## Quick Start

### Prerequisites
- Node.js 22+
- npm

### 1. Install Dependencies

```bash
cd /path/to/solana-trading-bot

# Install main dependencies (includes Express)
npm install

# Install frontend dependencies
npm run build:frontend
```

### 2. Run the Dashboard

**Option A: Backend only (frontend already built)**
```bash
npm run dashboard
# or
npm run start:dashboard
```

**Option B: Development mode (with auto-reload)**
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend (in web/ directory)
npm run dev:frontend
```

**Option C: Full stack (frontend + backend together)**
```bash
npm run dev
```

### 3. Access Dashboard

Open in browser:
```
http://localhost:3001
```

Or from another machine on your network:
```
http://<your-machine-ip>:3001
```

---

## Architecture

### Backend (Express Server)
**File:** `src/dashboard.js`

**Port:** 3001 (configurable via `DASHBOARD_PORT` env var)

**Endpoints:**
- `GET /api/status` - Bot running status, uptime
- `GET /api/portfolio` - P&L, win rate, metrics
- `GET /api/positions` - Open and closed positions
- `GET /api/alerts` - Recent alerts and events
- `GET /api/sentiment` - Sentiment analysis data
- `GET /api/performance` - Charts data (P&L trends)
- `GET /api/risk` - Risk management status
- `GET /api/health` - System health check

**Data Sources:**
- `state/bot-state.json` - Current bot state
- `state/metrics.json` - Portfolio metrics
- `state/heartbeat.json` - Latest heartbeat
- `logs/trading.log` - Recent alerts

### Frontend (React + Vite)
**Directory:** `web/`

**Tech Stack:**
- React 18
- Vite (fast build tool)
- Tailwind CSS (styling)

**Components:**
- `StatusPanel` - Bot status and uptime
- `PortfolioOverview` - P&L and metrics
- `RiskMonitor` - Safeguards and risk levels
- `PositionsTable` - Open and closed trades
- `PerformanceCharts` - P&L trends
- `SentimentOverview` - Token sentiment data
- `AlertsFeed` - Recent events

---

## File Structure

```
solana-trading-bot/
├── src/
│   └── dashboard.js                 # Express backend server
│
├── web/                             # React frontend
│   ├── src/
│   │   ├── App.jsx                  # Main app component
│   │   ├── App.css                  # Tailwind CSS
│   │   ├── main.jsx                 # Entry point
│   │   └── components/              # React components
│   │       ├── StatusPanel.jsx
│   │       ├── PortfolioOverview.jsx
│   │       ├── RiskMonitor.jsx
│   │       ├── PositionsTable.jsx
│   │       ├── PerformanceCharts.jsx
│   │       ├── SentimentOverview.jsx
│   │       └── AlertsFeed.jsx
│   ├── index.html                   # HTML template
│   ├── vite.config.js               # Vite config
│   ├── tailwind.config.js           # Tailwind config
│   ├── postcss.config.js            # PostCSS config
│   ├── package.json                 # Frontend dependencies
│   └── dist/                        # Built frontend (generated)
│
└── package.json                     # Main dependencies
```

---

## Development

### Run in Development Mode

```bash
# Install all dependencies first
npm install
npm run build:frontend

# Option 1: Backend only (with pre-built frontend)
npm run dashboard

# Option 2: Frontend + Backend together
npm run dev:backend &
npm run dev:frontend
```

### Frontend Development

```bash
cd web
npm install
npm run dev
# Dashboard available at http://localhost:3000
# Auto-proxies API calls to http://localhost:3001
```

### Build for Production

```bash
npm run build:frontend
# Creates optimized build in web/dist/
```

---

## Configuration

### Environment Variables

Create or update `.env`:

```bash
# Dashboard port (default: 3001)
DASHBOARD_PORT=3001

# Other bot configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
DISCORD_WEBHOOK_ALERTS=https://discordapp.com/api/webhooks/...
```

### Backend Configuration

Edit `src/dashboard.js`:

```javascript
const dashboard = new DashboardServer(3001); // Port
dashboard.start();
```

### Frontend Customization

- **Styling:** Edit `web/src/App.css` or Tailwind classes
- **Components:** Edit `web/src/components/*.jsx`
- **Build:** Edit `web/vite.config.js`

---

## Features

### Real-Time Updates
- Dashboard refreshes every 5 seconds automatically
- Manual refresh button for immediate updates
- WebSocket support for future live updates

### Responsive Design
- **Desktop:** Full layout with side-by-side panels
- **Tablet:** Adjusted grid layout
- **Mobile:** Single column, touch-friendly

### Dark Mode
- Professional dark theme (gray-900 background)
- High contrast text for readability
- Color coding: Green (gains), Red (losses), Yellow (warnings)

### Performance Monitoring
- Portfolio P&L trends (24h chart)
- Win rate tracking
- Largest wins/losses breakdown
- Average trade metrics

### Position Management
- Open positions table with real-time P&L
- Trade history with exit reasons
- Click for detailed position info
- Color-coded P&L indicators

### Risk Monitoring
- Portfolio stop loss status
- Daily loss limit tracking
- Position limits visualization
- Safeguard health indicators

### Alerts
- Recent events feed (up to 20)
- Color-coded by severity
- Auto-scrolling for new alerts
- Click to see full details

---

## Usage

### Monitoring Bot Performance
1. Open http://localhost:3001
2. Check Status panel for bot health
3. View Portfolio for overall P&L
4. Check Open Positions for active trades
5. Monitor Alerts for recent events

### During Trading
1. Watch Portfolio panel for real-time P&L updates
2. Check Positions table for entry/exit signals
3. Monitor Risk panel for safeguard status
4. Review Sentiment for trend changes

### Analysis
1. View Performance charts for P&L trends
2. Check Sentiment data for market conditions
3. Review Trade History for closed positions
4. Analyze win rate and statistics

---

## API Reference

### GET /api/status

Returns bot running status and uptime.

**Response:**
```json
{
  "running": true,
  "uptime": 9240,
  "uptimeFormatted": "2h 34m",
  "scanCount": 459,
  "tradeCount": 12,
  "memory": {
    "heapUsed": 52428800,
    "heapTotal": 536870912
  },
  "errors": 2
}
```

### GET /api/portfolio

Returns portfolio metrics.

**Response:**
```json
{
  "totalPnl": 0.42,
  "totalPnlPercent": 21.0,
  "realizedPnl": 0.15,
  "unrealizedPnl": 0.27,
  "winRate": 66.7,
  "totalTrades": 6,
  "winTrades": 4,
  "lossTrades": 2
}
```

### GET /api/positions

Returns open and closed positions.

**Response:**
```json
{
  "open": [
    {
      "id": "1",
      "symbol": "BONK",
      "entryPrice": 0.0023,
      "currentPrice": 0.0026,
      "pnl": 0.15,
      "pnlPercent": 30.4,
      "duration": 5040
    }
  ],
  "closed": [...]
}
```

### GET /api/alerts?limit=20

Returns recent alerts.

**Response:**
```json
{
  "alerts": [
    {
      "timestamp": "14:23:45",
      "level": "info",
      "message": "Position opened: BONK (0.5 SOL @ 0.0023)",
      "type": "info"
    }
  ],
  "total": 15
}
```

### GET /api/sentiment

Returns sentiment analysis for monitored tokens.

**Response:**
```json
{
  "tokens": [
    {
      "symbol": "BONK",
      "sentiment_score": 0.72,
      "sentiment_label": "positive",
      "twitter_mentions": 85,
      "twitter_growth": 12,
      "discord_members": 4200
    }
  ],
  "average_sentiment": 0.58
}
```

### GET /api/performance?timeframe=24h

Returns performance charts data.

**Response:**
```json
{
  "pnl_chart": [
    {
      "timestamp": "2024-02-11T10:00:00Z",
      "pnl": 0.05,
      "portfolio_value": 2.05
    }
  ],
  "largest_wins": [...],
  "largest_losses": [...]
}
```

### GET /api/risk

Returns risk management status.

**Response:**
```json
{
  "portfolio_stop_loss_percent": 30,
  "portfolio_current_loss_percent": 5,
  "daily_loss_limit": 30,
  "daily_loss_current": 0.05,
  "max_simultaneous_positions": 4,
  "current_positions": 3,
  "safeguards_active": true,
  "health_status": "good"
}
```

---

## Troubleshooting

### Dashboard won't start

**Error:** "Port 3001 already in use"

```bash
# Find and kill process on port 3001
lsof -i :3001
kill -9 <PID>

# Or use different port
DASHBOARD_PORT=3002 npm run dashboard
```

### No data showing

**Cause:** Bot daemon not running or no state files yet

```bash
# Start daemon in another terminal
npm start

# Wait a few seconds for first heartbeat
# Then refresh dashboard
```

### Blank page / 404 error

**Cause:** Frontend not built

```bash
# Build frontend
npm run build:frontend

# Restart dashboard
npm run dashboard
```

### API calls failing

**Cause:** Backend not running or wrong port

```bash
# Check if dashboard is running
curl http://localhost:3001/api/status

# Start dashboard if not running
npm run dashboard
```

### Cannot access from another machine

**Cause:** Firewall or incorrect IP

```bash
# Check your machine IP
ifconfig  # macOS/Linux
ipconfig  # Windows

# Or use localhost if accessing locally
# Use your-ip:3001 from other machines
http://192.168.1.100:3001
```

---

## Performance

### Memory Usage
- Backend: ~50-100 MB
- Frontend: ~20-30 MB
- Total: ~70-130 MB

### CPU Usage
- Backend: <1% idle
- Frontend: <1% idle
- Update cycle: Every 5 seconds

### Network
- Initial load: ~500 KB (React + CSS)
- Per update: ~10-20 KB (JSON responses)
- Auto-refresh: 5 API calls every 5 seconds

---

## Production Deployment

### Docker Deployment

Use the existing Docker setup:

```bash
npm run docker:build
npm run docker:up
# Access at http://localhost:3001
```

### VPS Deployment

1. Copy repository to VPS
2. Install Node.js 22+
3. Build frontend:
   ```bash
   npm run build:frontend
   ```

4. Use process manager (PM2):
   ```bash
   npm run pm2:start
   ```

5. Or use Systemd (update paths):
   ```bash
   sudo cp solana-bot.service /etc/systemd/system/
   sudo systemctl enable solana-bot
   sudo systemctl start solana-bot
   ```

6. Access via:
   ```
   http://your-vps-ip:3001
   ```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Future Enhancements

- [ ] WebSocket for real-time updates
- [ ] Recharts for advanced charting
- [ ] Position close button (manual exit)
- [ ] Sentiment trend charts
- [ ] Export trading data (CSV)
- [ ] Settings panel for customization
- [ ] Dark/Light theme toggle
- [ ] Mobile app wrapper

---

## Support

**Issues?**

1. Check backend logs:
   ```bash
   npm run logs
   ```

2. Check browser console (F12)

3. Verify backend running:
   ```bash
   curl http://localhost:3001/api/status
   ```

4. Check bot daemon running:
   ```bash
   npm run metrics:view
   ```

5. Review error logs:
   ```bash
   npm run logs:errors
   ```

---

## Quick Commands

```bash
# Start everything
npm run dashboard

# Frontend development
npm run dev:frontend

# Backend development  
npm run dev:backend

# Build frontend for production
npm run build:frontend

# View dashboard
npm run web:dev

# Check status
npm run state:view

# View logs
npm run logs
```

---

**Version:** 1.0.0  
**Last Updated:** 2024-02-11  
**Status:** ✅ Production Ready
