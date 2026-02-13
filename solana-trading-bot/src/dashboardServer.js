import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import stateManager from './stateManager.js'
import logger from './logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.DASHBOARD_PORT || 3001

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})
app.use(express.json())

// Serve static files from the web/dist directory
const distPath = path.join(__dirname, '../web/dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
}

// Helper function to format uptime
function formatUptime(ms) {
  return ms ? Math.floor(ms / 1000) : 0
}

// Helper function to calculate health status
function calculateHealth() {
  const heartbeat = stateManager.getLastHeartbeat()
  if (!heartbeat) return 'unknown'

  const timeSinceHeartbeat = Date.now() - new Date(heartbeat.timestamp).getTime()
  
  if (timeSinceHeartbeat > 300000) return 'critical'
  if (timeSinceHeartbeat > 60000) return 'warning'
  return 'healthy'
}

// Helper function to read log file
function readLogFile(filename, lines = 20) {
  try {
    const logPath = path.join(__dirname, '../logs', filename)
    if (!fs.existsSync(logPath)) return []

    const content = fs.readFileSync(logPath, 'utf8')
    return content.split('\n')
      .filter(line => line.trim())
      .slice(-lines)
      .reverse()
  } catch (error) {
    return []
  }
}

// Helper to parse log entries
function parseLogEntries(lines) {
  return lines.map((line, idx) => {
    try {
      const jsonMatch = line.match(/\{.*\}/)
      if (jsonMatch) {
        const entry = JSON.parse(jsonMatch[0])
        return {
          type: entry.level || 'info',
          message: entry.message || line,
          timestamp: entry.timestamp || new Date().toISOString(),
          details: entry
        }
      }
      return {
        type: 'info',
        message: line,
        timestamp: new Date().toISOString()
      }
    } catch {
      return {
        type: 'info',
        message: line,
        timestamp: new Date().toISOString()
      }
    }
  })
}

// API Routes

// Status endpoint
app.get('/api/status', (req, res) => {
  const state = stateManager.loadState()
  const heartbeat = stateManager.getLastHeartbeat()
  
  const uptime = heartbeat ? formatUptime(heartbeat.uptime * 1000) : 0
  const memory = heartbeat ? Math.round(heartbeat.memoryUsage.heapUsed / 1024 / 1024) : 0
  const lastScan = heartbeat ? Math.floor((Date.now() - new Date(heartbeat.timestamp).getTime()) / 1000) : 0

  res.json({
    running: state.isRunning !== false,
    uptime,
    lastScan,
    memory,
    health: calculateHealth(),
    sessionId: state.sessionId,
    startTime: state.startTime
  })
})

// Portfolio endpoint
app.get('/api/portfolio', (req, res) => {
  const metrics = stateManager.loadMetrics()
  
  const totalPnl = metrics.totalPnl || 0
  const totalWins = metrics.totalWins || 0
  const totalLosses = metrics.totalLosses || 0
  const totalTrades = metrics.totalTrades || 0
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0

  // Mock data - replace with actual bot data
  const capitalUsed = 1.2
  const remaining = 2.0 - capitalUsed
  const pnlPercent = remaining > 0 ? (totalPnl / 2.0) * 100 : 0

  res.json({
    totalPnl,
    pnlPercent,
    winRate,
    totalTrades,
    totalWins,
    totalLosses,
    capitalUsed,
    remaining
  })
})

// Open positions endpoint
app.get('/api/positions/open', (req, res) => {
  // Mock data - replace with actual bot data
  const positions = [
    {
      symbol: 'BONK',
      entryPrice: 0.000000034,
      currentPrice: 0.000000037,
      pnl: 0.015,
      pnlPercent: 8.82,
      timeHeld: 3600,
      entryTime: new Date(Date.now() - 3600000).toISOString()
    },
    {
      symbol: 'COPE',
      entryPrice: 0.0000012,
      currentPrice: 0.0000011,
      pnl: -0.008,
      pnlPercent: -8.33,
      timeHeld: 1800,
      entryTime: new Date(Date.now() - 1800000).toISOString()
    }
  ]

  res.json(positions)
})

// Closed positions endpoint
app.get('/api/positions/closed', (req, res) => {
  // Mock data - replace with actual bot data
  const positions = [
    {
      symbol: 'COPE',
      entryPrice: 0.0000012,
      exitPrice: 0.0000013,
      pnl: 0.025,
      duration: 7200,
      reason: 'TP',
      exitTime: new Date().toISOString()
    },
    {
      symbol: 'DUST',
      entryPrice: 0.00000015,
      exitPrice: 0.00000014,
      pnl: -0.012,
      duration: 1200,
      reason: 'SL',
      exitTime: new Date(Date.now() - 3600000).toISOString()
    }
  ]

  res.json(positions)
})

// Charts - P&L over time
app.get('/api/charts/pnl', (req, res) => {
  // Generate mock hourly data for last 24 hours
  const data = []
  for (let i = 23; i >= 0; i--) {
    const time = new Date()
    time.setHours(time.getHours() - i)
    data.push({
      timestamp: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      pnl: Math.sin(i / 4) * 0.3 + (Math.random() - 0.5) * 0.1
    })
  }
  res.json(data)
})

// Charts - Daily P&L
app.get('/api/charts/daily', (req, res) => {
  // Generate mock daily data for last 7 days
  const data = []
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    data.push({
      date: days[date.getDay()],
      pnl: (Math.random() - 0.4) * 0.5
    })
  }
  res.json(data)
})

// Alerts endpoint
app.get('/api/alerts', (req, res) => {
  const alertLogs = readLogFile('trading.log', 50)
  const alerts = parseLogEntries(alertLogs)
    .filter(log => log.type !== 'debug')
    .slice(0, 20)

  res.json(alerts)
})

// Risk endpoint
app.get('/api/risk', (req, res) => {
  res.json({
    dailyLoss: -0.15,
    dailyLimit: 0.6,
    portfolioLoss: -0.18,
    portfolioLimit: 0.6,
    openCount: 2,
    maxPositions: 4,
    safeguards: true
  })
})

// Sentiment endpoint
app.get('/api/sentiment', (req, res) => {
  // Mock sentiment data
  const sentiments = [
    {
      token: 'BONK',
      score: 0.78,
      platforms: {
        twitter: 0.75,
        discord: 0.82,
        telegram: 0.76
      }
    },
    {
      token: 'COPE',
      score: 0.62,
      platforms: {
        twitter: 0.60,
        discord: 0.65,
        telegram: 0.61
      }
    },
    {
      token: 'DUST',
      score: 0.45,
      platforms: {
        twitter: 0.42,
        discord: 0.48,
        telegram: 0.45
      }
    }
  ]
  res.json(sentiments)
})

// Serve the React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).json({ error: 'Dashboard not built. Run: npm run web:build' })
  }
})

// Error handling
app.use((err, req, res, next) => {
  logger.error('Express error:', err)
  res.status(500).json({ error: err.message })
})

// Start server
export function startDashboard() {
  const server = app.listen(PORT, () => {
    logger.info(`Dashboard server running on http://localhost:${PORT}`)
  })
  return server
}

// Start server directly if run as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  startDashboard()
}

// Export the app for testing
export { app }
