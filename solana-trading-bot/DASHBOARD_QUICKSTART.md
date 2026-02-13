# Dashboard Quick Start Guide

Get your trading bot dashboard running in minutes!

## ⚡ Quick Start

### 1. One Command to Build & Run

```bash
npm run web:build
npm run dashboard
```

Then visit: **http://localhost:3001**

That's it! You're now monitoring your trading bot.

## 🚀 Development Setup (Recommended for Development)

### Hot Reload Development Server

```bash
npm run web:dev
```

Access at: **http://localhost:5173** (with hot reload)

### How it works:
- Vite dev server runs on port 5173
- API calls automatically proxy to `http://localhost:3001`
- Changes save instantly (hot module replacement)
- Perfect for development and customization

## 📊 Dashboard Features at a Glance

### Top Sections
1. **System Status** - Bot running? Memory usage? Health check?
2. **Portfolio Overview** - Your P&L, win rate, capital deployed
3. **Open Positions** - Real-time position tracking (updates every 5 seconds)
4. **Live Alerts** - Last 20 events with color coding

### Analysis Sections
1. **Charts** - 24h P&L line chart, 7-day bar chart, win/loss pie
2. **Trade History** - All closed trades, searchable & filterable
3. **Risk Monitor** - Daily loss limit, portfolio safeguards, position tracking
4. **Sentiment** - Social sentiment analysis by platform

## 🎨 Customization

### Change Colors
Edit `web/src/index.css`:
```css
.text-success { @apply text-green-400; }  /* Change green */
.text-danger { @apply text-red-400; }     /* Change red */
```

### Change Refresh Rate
Edit component files:
```jsx
// Change from 5000ms to your preference
const { data } = useApi('/positions/open', { interval: 10000 })
```

### Add New Metrics
Add to `src/dashboardServer.js`:
```js
app.get('/api/custom-metric', (req, res) => {
  res.json({ your: 'data' })
})

// Then use in React component:
const { data } = useApi('/custom-metric')
```

## 🔧 Configuration

### Port Configuration
Create `.env` file:
```env
DASHBOARD_PORT=3001
```

### API Data Sources
Dashboard reads from:
- `src/stateManager.js` - Bot state
- `logs/trading.log` - Trade events
- `logs/error.log` - Errors and warnings

## 📱 Responsive Design

The dashboard is fully responsive:
- ✅ Desktop - Full sidebar + all features
- ✅ Tablet - Collapsed sidebar, stacked layout
- ✅ Mobile - Touch-friendly, minimal sidebar

## 🎯 Typical Workflow

### Morning Routine
1. Open dashboard: `http://localhost:3001`
2. Check Status Panel - Is bot running?
3. Check Portfolio - Any overnight trades?
4. Review Alerts - Any errors overnight?

### During Trading
1. Watch Open Positions - Real-time updates
2. Monitor Alerts Feed - Instant notifications
3. Check Risk Monitor - Within safeguards?

### End of Day
1. Export Trade History (if needed)
2. Review Daily P&L chart
3. Check for any errors in logs

## 🚨 Troubleshooting

### Dashboard Won't Load
```bash
# Rebuild and restart
npm run web:build
npm run dashboard

# Check if port 3001 is in use
lsof -i :3001
```

### API Endpoints Return 404
```bash
# Make sure dashboardServer.js is running
# Check that stateManager is properly initialized
npm run dashboard
```

### Vite Dev Server Issues
```bash
# Clear node_modules and reinstall
rm -rf web/node_modules
npm run web:dev
```

### Hot Reload Not Working
```bash
# Restart Vite
Ctrl+C
npm run web:dev
```

## 📈 Data Integration

The dashboard automatically reads from your bot:

**Automatic Data Sources:**
- Bot state from `state/bot-state.json`
- Metrics from `state/metrics.json`
- Heartbeat from `state/heartbeat.json`
- Logs from `logs/trading.log`

**No Configuration Needed** - Just run the dashboard and it works!

## 🎮 Example API Usage

Want to add custom endpoints? Edit `src/dashboardServer.js`:

```javascript
// Add new endpoint
app.get('/api/custom', (req, res) => {
  const data = {
    metric1: 123,
    metric2: 456
  }
  res.json(data)
})
```

Then use in React:
```jsx
const { data } = useApi('/custom')
```

## 🔒 Security

Dashboard runs locally by default:
- Only accessible on `http://localhost:3001`
- No private keys exposed
- All data is local

To expose publicly (not recommended):
```bash
# Change in dashboardServer.js
const PORT = process.env.DASHBOARD_PORT || 3001
// Listen on all interfaces:
app.listen(PORT, '0.0.0.0')
```

## 📚 Learn More

- **Detailed Docs**: See `DASHBOARD.md`
- **Component Docs**: Check `web/src/components/`
- **API Reference**: See `src/dashboardServer.js`

## ❓ FAQs

**Q: Can I run this on a different port?**
A: Yes, set `DASHBOARD_PORT=8080` in `.env`

**Q: Can multiple people view the dashboard?**
A: Yes, if exposed to network (see Security section)

**Q: How do I add more data to the dashboard?**
A: Add endpoint to `dashboardServer.js`, create React component

**Q: Does it slow down my bot?**
A: No, it reads from log files and state, minimal impact

**Q: Can I customize the layout?**
A: Yes, edit `web/src/pages/Dashboard.jsx`

## 🎉 You're Ready!

```bash
npm run web:dev      # Or: npm run dashboard
# Visit http://localhost:3001 (or 5173)
# Start monitoring!
```

Happy trading! 🚀
