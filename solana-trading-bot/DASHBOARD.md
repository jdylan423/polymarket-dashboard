# Trading Bot Dashboard

A professional, real-time React web dashboard for monitoring and controlling the Solana momentum trading bot.

## Features

### 🎯 Core Dashboards

1. **System Status Panel**
   - Bot Status (🟢 Running / 🔴 Stopped)
   - Uptime tracking (HH:MM:SS format)
   - Last scan timestamp
   - Memory usage in MB
   - Health status (✓ Healthy / ⚠ Warning / ✗ Critical)

2. **Portfolio Overview**
   - Total P&L in SOL with color coding
   - P&L percentage
   - Win rate (Wins/Losses breakdown)
   - Total trades count
   - Capital deployed vs. remaining
   - Visual progress bar for capital allocation

3. **Open Positions Table**
   - Real-time position tracking (5s refresh)
   - Columns: Token Symbol, Entry Price, Current Price, P&L, P&L %, Time Held, Actions
   - Color-coded P&L (Green for gains, Red for losses)
   - Sortable by Symbol, P&L, or Time Held
   - Expandable row details
   - Manual close button for each position

4. **Charts & Analytics**
   - P&L Over Time: Line chart for last 24 hours
   - Daily P&L: Bar chart for last 7 days
   - Win/Loss Distribution: Pie chart
   - Trade statistics box with:
     - Total trades, wins, losses
     - Average win/loss amounts
     - Profit factor

5. **Trade History**
   - Last 20 closed positions
   - Columns: Token, Entry Price, Exit Price, P&L, Duration, Result (TP/SL/Manual)
   - Searchable by token symbol
   - Filterable by exit reason
   - Expandable rows for detailed trade info

6. **Live Alerts Feed**
   - Real-time event notifications
   - Last 20 events
   - Color-coded: Green (success), Yellow (warning), Red (error)
   - Timestamps for each alert
   - Auto-scroll to latest
   - Connection status indicator
   - WebSocket real-time push updates

7. **Risk Monitor**
   - Daily P&L Limit: Visual progress bar
   - Portfolio Stop Loss: 30% limit tracking
   - Open Positions: 4-slot limit indicator
   - Max Position Size: 0.5 SOL enforcement info
   - Safeguards Status: Active/Inactive indicator
   - Color-coded risk levels (Safe/Warning/Danger)

8. **Sentiment Analysis** (Optional)
   - Current sentiment scores for monitored tokens
   - 0-1 scale with color coding
   - Platform breakdown: Twitter/Discord/Telegram
   - Color scale: Red (<0.4), Yellow (0.4-0.6), Green (>0.6)

## Technology Stack

### Frontend
- **React 18+** - UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - React charting library
- **Axios** - HTTP client for API calls

### Backend
- **Express.js** - Node.js web server
- **CORS** - Cross-origin resource sharing
- **Socket.IO** (Optional) - Real-time WebSocket support

## Project Structure

```
solana-trading-bot/
├── web/                           # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── StatusPanel.jsx
│   │   │   ├── PortfolioOverview.jsx
│   │   │   ├── PositionsTable.jsx
│   │   │   ├── Charts.jsx
│   │   │   ├── TradeHistory.jsx
│   │   │   ├── AlertsFeed.jsx
│   │   │   ├── RiskMonitor.jsx
│   │   │   └── SentimentAnalysis.jsx
│   │   ├── pages/
│   │   │   └── Dashboard.jsx       # Main layout
│   │   ├── hooks/
│   │   │   ├── useApi.js           # API data fetching
│   │   │   └── useWebSocket.js     # Real-time updates
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css               # Tailwind imports
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── dist/                       # Built files (generated)
├── src/
│   ├── dashboardServer.js          # Express API server
│   └── ... (other bot files)
└── package.json                    # Root config with web scripts
```

## Installation & Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Web dependencies are installed separately via npm run web:build
```

### 2. Build for Production

```bash
npm run web:build
```

This will:
- Install React dependencies in `web/`
- Build the React app into `web/dist/`
- Ready to serve via Express

### 3. Start Development

Two options:

**Option A: Full Stack Dev (Recommended)**
```bash
npm run web:dev
```
- Starts Vite dev server on `http://localhost:5173`
- Vite proxies API calls to `http://localhost:3001`
- Hot module replacement enabled

**Option B: Production Dashboard**
```bash
npm run web:start
```
- Builds React app
- Starts Express server on `http://localhost:3001`
- Serves both API and static files from same port

## API Endpoints

All endpoints return JSON and are designed to be consumed by the React frontend.

### Status & System
```
GET /api/status
{
  running: boolean,
  uptime: number (seconds),
  lastScan: number (seconds ago),
  memory: number (MB),
  health: 'healthy' | 'warning' | 'critical',
  sessionId: string,
  startTime: ISO string
}
```

### Portfolio
```
GET /api/portfolio
{
  totalPnl: number (SOL),
  pnlPercent: number (%),
  winRate: number (%),
  totalTrades: number,
  totalWins: number,
  totalLosses: number,
  capitalUsed: number (SOL),
  remaining: number (SOL)
}
```

### Open Positions
```
GET /api/positions/open
[
  {
    symbol: string,
    entryPrice: number,
    currentPrice: number,
    pnl: number (SOL),
    pnlPercent: number (%),
    timeHeld: number (seconds),
    entryTime: ISO string
  }
]
```

### Closed Positions
```
GET /api/positions/closed
[
  {
    symbol: string,
    entryPrice: number,
    exitPrice: number,
    pnl: number (SOL),
    duration: number (seconds),
    reason: 'TP' | 'SL' | 'Manual',
    exitTime: ISO string
  }
]
```

### Charts Data
```
GET /api/charts/pnl
[{ timestamp: string, pnl: number }]  // Last 24 hours hourly

GET /api/charts/daily
[{ date: string, pnl: number }]  // Last 7 days
```

### Alerts
```
GET /api/alerts
[
  {
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    timestamp: ISO string,
    details?: string
  }
]
```

### Risk Monitoring
```
GET /api/risk
{
  dailyLoss: number (SOL),
  dailyLimit: number (SOL),
  portfolioLoss: number (SOL),
  portfolioLimit: number (SOL),
  openCount: number,
  maxPositions: number,
  safeguards: boolean
}
```

### Sentiment Analysis
```
GET /api/sentiment
[
  {
    token: string,
    score: number (0-1),
    platforms: {
      twitter?: number,
      discord?: number,
      telegram?: number
    }
  }
]
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Dashboard Configuration
DASHBOARD_PORT=3001              # Port to run the dashboard server

# React Vite Config (web/.env if needed)
VITE_API_BASE=/api               # API base URL (proxied by Vite)
```

### Customization

**Theme Colors** - Edit `web/src/index.css` or `web/tailwind.config.js`:
```js
// Dark mode colors
const colors = {
  primary: 'blue',
  success: 'green',
  danger: 'red',
  warning: 'yellow'
}
```

**Refresh Intervals** - Modify in individual components:
```jsx
// Default 5 seconds
const { data } = useApi('/positions/open', { interval: 5000 })
```

## Usage

### Development Mode

```bash
# Terminal 1: Start the dashboard with Vite dev server
npm run web:dev

# Your dashboard auto-reloads at http://localhost:5173
# API calls are proxied to http://localhost:3001
```

### Production Mode

```bash
# Build and run
npm run web:start

# Access at http://localhost:3001
```

### Monitoring Bot Activity

1. **Live Position Tracking** - Positions update every 5 seconds
2. **Real-Time Alerts** - Check the Alerts Feed for latest events
3. **P&L Analysis** - View charts for 24h and 7-day trends
4. **Risk Dashboard** - Monitor safeguards and limits

## Performance Optimizations

- ✅ Lazy component loading
- ✅ Efficient re-renders (React hooks)
- ✅ Debounced API calls
- ✅ Compressed Vite build
- ✅ Tailwind CSS purging
- ✅ Optimized chart rendering

## Browser Compatibility

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Dashboard Won't Load
```bash
# Check if Express server is running
lsof -i :3001

# Check if built files exist
ls -la web/dist/

# Rebuild
npm run web:build
```

### API Calls Failing
```bash
# Check CORS headers
curl -i http://localhost:3001/api/status

# Verify API endpoint exists
grep 'app.get' src/dashboardServer.js
```

### WebSocket Connection Issues
- Check browser console for errors
- Verify server is running
- Check firewall settings

### Hot Module Replacement (HMR) Not Working
```bash
# Kill the process and restart
npm run web:dev
```

## Future Enhancements

- [ ] Real-time WebSocket data streaming
- [ ] Trade execution from dashboard
- [ ] Customizable dashboard layout
- [ ] Export trading data (CSV/PDF)
- [ ] Mobile app (React Native)
- [ ] Multi-wallet support
- [ ] Advanced analytics & backtesting visualizer
- [ ] Discord/Telegram bot integration

## Security Considerations

- ✅ No private keys exposed in frontend
- ✅ API runs on localhost by default
- ✅ CORS configured for development
- ✅ Secure WebSocket option available
- ✅ Input validation on all endpoints

## Support & Maintenance

For issues or contributions:
1. Check existing logs: `npm run logs`
2. Review component props
3. Check network tab in browser DevTools
4. Verify API endpoints are returning data

## License

MIT
