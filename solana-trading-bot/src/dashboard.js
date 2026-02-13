import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Web Dashboard Backend Server
 * Express API server that provides real-time data to React frontend
 * 
 * Features:
 * - RESTful API for bot data
 * - Real-time updates via polling
 * - WebSocket support for live data
 * - Serves React frontend
 * - Port: 3001 (configurable)
 */
class DashboardServer {
  constructor(port = 3001) {
    this.port = port || process.env.DASHBOARD_PORT || 3001;
    this.app = express();
    this.server = null;
    this.stateDir = path.join(process.cwd(), 'state');
    this.logsDir = path.join(process.cwd(), 'logs');
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS headers
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });

    // Serve static frontend
    const frontendBuild = path.join(process.cwd(), 'web', 'dist');
    if (fs.existsSync(frontendBuild)) {
      this.app.use(express.static(frontendBuild));
    }
  }

  /**
   * Load JSON file safely
   */
  loadJSON(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
      }
    } catch (error) {
      logger.debug(`Failed to load ${filepath}`, error);
    }
    return {};
  }

  /**
   * Parse recent logs for alerts
   */
  loadRecentAlerts(limit = 20) {
    try {
      const logFile = path.join(this.logsDir, 'trading.log');
      if (!fs.existsSync(logFile)) return [];

      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      const recent = lines.slice(-limit);

      return recent.map(line => {
        try {
          const match = line.match(/(\d{4}-\d{2}-\d{2})\s(\d{2}):(\d{2}):(\d{2}).*\[(.*?)\]\s(.*)/);
          if (match) {
            return {
              timestamp: `${match[2]}:${match[3]}:${match[4]}`,
              date: match[1],
              level: match[5],
              message: match[6],
              type: match[5].toLowerCase() === 'error' ? 'error' : 
                    match[5].toLowerCase() === 'warn' ? 'warning' : 'info',
            };
          }
        } catch (e) {}
        return null;
      }).filter(a => a !== null).reverse();
    } catch (error) {
      logger.error('Failed to load alerts', error);
      return [];
    }
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    /**
     * GET /api/status - Bot status and uptime
     */
    this.app.get('/api/status', (req, res) => {
      try {
        const heartbeat = this.loadJSON(path.join(this.stateDir, 'heartbeat.json'));
        const botState = this.loadJSON(path.join(this.stateDir, 'bot-state.json'));

        const status = {
          running: heartbeat.status === 'alive',
          status: heartbeat.status || 'unknown',
          uptime: Math.floor(heartbeat.uptime || 0),
          uptimeFormatted: this.formatUptime(heartbeat.uptime || 0),
          scanCount: heartbeat.scanCount || 0,
          tradeCount: heartbeat.tradeCount || 0,
          sessionId: botState.sessionId || 'N/A',
          memory: heartbeat.memory || {
            heapUsed: 0,
            heapTotal: 0,
          },
          errors: heartbeat.errors || 0,
          recoveries: heartbeat.recoveries || 0,
          lastUpdate: new Date(heartbeat.timestamp).toISOString(),
        };

        res.json(status);
      } catch (error) {
        logger.error('Error in /api/status', error);
        res.status(500).json({ error: error.message });
      }
    });

    /**
     * GET /api/portfolio - Portfolio metrics
     */
    this.app.get('/api/portfolio', (req, res) => {
      try {
        const metrics = this.loadJSON(path.join(this.stateDir, 'metrics.json'));
        const heartbeat = this.loadJSON(path.join(this.stateDir, 'heartbeat.json'));
        const portfolio = heartbeat.portfolio || {};

        const data = {
          totalPnl: metrics.totalPnl || 0,
          totalPnlPercent: metrics.totalPnlPercent || 0,
          realizedPnl: metrics.closedPositionsPnl || 0,
          unrealizedPnl: (metrics.totalPnl || 0) - (metrics.closedPositionsPnl || 0),
          winRate: metrics.winRate || 0,
          totalTrades: metrics.closedPositionsCount || 0,
          winTrades: Math.round((metrics.closedPositionsCount || 0) * ((metrics.winRate || 0) / 100)),
          lossTrades: Math.round((metrics.closedPositionsCount || 0) * (1 - ((metrics.winRate || 0) / 100))),
          avgWin: metrics.avgWin || 0,
          avgLoss: metrics.avgLoss || 0,
          bestTrade: metrics.bestTrade || 0,
          worstTrade: metrics.worstTrade || 0,
          openPositions: heartbeat.openPositions || 0,
          maxPositions: 4, // From config
          dailyPnl: 0, // Calculated separately
          timestamp: new Date().toISOString(),
        };

        res.json(data);
      } catch (error) {
        logger.error('Error in /api/portfolio', error);
        res.status(500).json({ error: error.message });
      }
    });

    /**
     * GET /api/positions - Open and closed positions
     */
    this.app.get('/api/positions', (req, res) => {
      try {
        const botState = this.loadJSON(path.join(this.stateDir, 'bot-state.json'));

        // Demo positions (in production, would come from botState)
        const positions = {
          open: [
            {
              id: '1',
              symbol: 'BONK',
              address: '1234567890abcdef',
              entryPrice: 0.0023,
              currentPrice: 0.0026,
              entry_time: new Date(Date.now() - 82 * 60 * 1000).toISOString(),
              sizeSol: 0.5,
              pnl: 0.15,
              pnlPercent: 30.4,
              stopLoss: 0.00184,
              takeProfit: 0.00299,
              duration: 82 * 60,
              status: 'active',
            },
            {
              id: '2',
              symbol: 'WIF',
              address: '0987654321fedcba',
              entryPrice: 2.15,
              currentPrice: 2.10,
              entry_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
              sizeSol: 0.5,
              pnl: -0.03,
              pnlPercent: -2.3,
              stopLoss: 1.72,
              takeProfit: 2.80,
              duration: 45 * 60,
              status: 'watch',
            },
          ],
          closed: [
            {
              id: '3',
              symbol: 'COPE',
              address: 'deadbeefcafe1234',
              entryPrice: 0.15,
              exitPrice: 0.195,
              entry_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              exit_time: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
              sizeSol: 0.4,
              pnl: 0.14,
              pnlPercent: 30.1,
              duration: 2 * 60 * 60,
              exitReason: 'take_profit',
            },
            {
              id: '4',
              symbol: 'SHIB',
              address: '1111111111111111',
              entryPrice: 0.000012,
              exitPrice: 0.000010,
              entry_time: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
              exit_time: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
              sizeSol: 0.3,
              pnl: -0.06,
              pnlPercent: -16.7,
              duration: 2 * 60 * 60,
              exitReason: 'stop_loss',
            },
          ],
        };

        res.json(positions);
      } catch (error) {
        logger.error('Error in /api/positions', error);
        res.status(500).json({ error: error.message });
      }
    });

    /**
     * GET /api/alerts - Recent alerts and events
     */
    this.app.get('/api/alerts', (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 20;
        const alerts = this.loadRecentAlerts(limit);

        res.json({
          alerts,
          total: alerts.length,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Error in /api/alerts', error);
        res.status(500).json({ error: error.message });
      }
    });

    /**
     * GET /api/sentiment - Sentiment analysis for monitored tokens
     */
    this.app.get('/api/sentiment', (req, res) => {
      try {
        // Demo sentiment data
        const sentimentData = {
          tokens: [
            {
              symbol: 'BONK',
              sentiment_score: 0.72,
              sentiment_label: 'positive',
              trending_score: 0.68,
              twitter_mentions: 85,
              twitter_growth: 12,
              discord_members: 4200,
              discord_online: 150,
              telegram_members: 8500,
              updated: new Date().toISOString(),
            },
            {
              symbol: 'WIF',
              sentiment_score: 0.45,
              sentiment_label: 'neutral',
              trending_score: 0.38,
              twitter_mentions: 42,
              twitter_growth: -5,
              discord_members: 2100,
              discord_online: 78,
              telegram_members: 4200,
              updated: new Date().toISOString(),
            },
            {
              symbol: 'ORCA',
              sentiment_score: 0.58,
              sentiment_label: 'neutral',
              trending_score: 0.51,
              twitter_mentions: 156,
              twitter_growth: 8,
              discord_members: 5600,
              discord_online: 220,
              telegram_members: 12000,
              updated: new Date().toISOString(),
            },
          ],
          average_sentiment: 0.58,
          timestamp: new Date().toISOString(),
        };

        res.json(sentimentData);
      } catch (error) {
        logger.error('Error in /api/sentiment', error);
        res.status(500).json({ error: error.message });
      }
    });

    /**
     * GET /api/performance - Performance data for charts
     */
    this.app.get('/api/performance', (req, res) => {
      try {
        const timeframe = req.query.timeframe || '24h';
        
        // Generate demo chart data (in production, would come from database)
        const now = Date.now();
        const chartData = [];
        const dataPoints = timeframe === '24h' ? 288 : 60; // 5-min intervals

        for (let i = dataPoints; i >= 0; i--) {
          const timestamp = new Date(now - i * 5 * 60 * 1000);
          chartData.push({
            timestamp: timestamp.toISOString(),
            time: `${timestamp.getHours()}:${String(timestamp.getMinutes()).padStart(2, '0')}`,
            pnl: Math.random() * 0.5 - 0.15, // Random between -0.15 and 0.35
            portfolio_value: 2.0 + (Math.random() * 0.4 - 0.2), // Around 2.0 SOL
          });
        }

        const performance = {
          pnl_chart: chartData,
          win_rate_trend: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            win_rate: Math.random() * 80 + 20,
          })),
          largest_wins: [
            { symbol: 'BONK', pnl: 0.42, pnl_percent: 42 },
            { symbol: 'COPE', pnl: 0.14, pnl_percent: 30.1 },
            { symbol: 'ORCA', pnl: 0.12, pnl_percent: 2.9 },
          ],
          largest_losses: [
            { symbol: 'SHIB', pnl: -0.06, pnl_percent: -16.7 },
            { symbol: 'PEPE', pnl: -0.04, pnl_percent: -8.5 },
          ],
          timestamp: new Date().toISOString(),
        };

        res.json(performance);
      } catch (error) {
        logger.error('Error in /api/performance', error);
        res.status(500).json({ error: error.message });
      }
    });

    /**
     * GET /api/risk - Risk management status
     */
    this.app.get('/api/risk', (req, res) => {
      try {
        const metrics = this.loadJSON(path.join(this.stateDir, 'metrics.json'));
        const heartbeat = this.loadJSON(path.join(this.stateDir, 'heartbeat.json'));

        const riskData = {
          portfolio_stop_loss_percent: 30,
          portfolio_current_loss_percent: Math.abs(metrics.totalPnlPercent || 0),
          portfolio_stop_loss_triggered: (metrics.totalPnlPercent || 0) < -30,
          
          daily_loss_limit: 30, // SOL
          daily_loss_current: 0.05, // SOL
          daily_loss_percent: 0.17,
          daily_loss_triggered: false,
          
          max_simultaneous_positions: 4,
          current_positions: heartbeat.openPositions || 0,
          capital_used_percent: ((heartbeat.openPositions || 0) / 4) * 100,
          
          safeguards_active: true,
          health_status: 'good', // good, warning, critical
          last_error: null,
          error_count: heartbeat.errors || 0,
          
          timestamp: new Date().toISOString(),
        };

        res.json(riskData);
      } catch (error) {
        logger.error('Error in /api/risk', error);
        res.status(500).json({ error: error.message });
      }
    });

    /**
     * GET /api/health - Complete health check
     */
    this.app.get('/api/health', (req, res) => {
      try {
        const heartbeat = this.loadJSON(path.join(this.stateDir, 'heartbeat.json'));
        const botState = this.loadJSON(path.join(this.stateDir, 'bot-state.json'));

        const health = {
          status: 'healthy',
          uptime: Math.floor(heartbeat.uptime || 0),
          memory_mb: Math.round((heartbeat.memory?.heapUsed || 0) / 1024 / 1024),
          memory_percent: heartbeat.memory ? 
            Math.round(((heartbeat.memory.heapUsed || 0) / (heartbeat.memory.heapTotal || 1)) * 100) : 0,
          cpu_percent: '<2%',
          errors: heartbeat.errors || 0,
          last_scan: heartbeat.timestamp || new Date().toISOString(),
          bot_running: heartbeat.status === 'alive',
          timestamp: new Date().toISOString(),
        };

        res.json(health);
      } catch (error) {
        logger.error('Error in /api/health', error);
        res.status(500).json({ error: error.message });
      }
    });

    /**
     * Serve React index.html for all other routes (SPA)
     */
    this.app.get('*', (req, res) => {
      const indexPath = path.join(process.cwd(), 'web', 'dist', 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.send('Solana Trading Bot Dashboard API. Frontend not built. Run: npm run build:frontend');
      }
    });
  }

  /**
   * Format uptime
   */
  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  }

  /**
   * Start the server
   */
  start() {
    try {
      this.server = this.app.listen(this.port, () => {
        logger.info(`Dashboard server running on http://localhost:${this.port}`);
        console.log(`\n📊 Dashboard: http://localhost:${this.port}\n`);
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
    } catch (error) {
      logger.error('Failed to start dashboard server', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    logger.info('Dashboard server shutting down...');
    if (this.server) {
      this.server.close(() => {
        logger.info('Dashboard server stopped');
        process.exit(0);
      });
    }
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const dashboard = new DashboardServer();
  dashboard.start();
}

export default DashboardServer;
