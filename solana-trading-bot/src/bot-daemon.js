import logger from './logger.js';
import config from './config.js';
import { validateConfig } from './config.js';
import jupiterData from './jupiterData.js';
import sentimentAnalysis from './sentimentAnalysis.js';
import positionManager from './positionManager.js';
import tradeExecution from './tradeExecution.js';
import stateManager from './stateManager.js';
import alerting from './alerting.js';

/**
 * Solana Momentum Trading Bot - Daemon Version
 * Continuous operation with monitoring, state persistence, and alerting
 */
class SolanaMomentumBotDaemon {
  constructor() {
    this.isRunning = false;
    this.intervals = {
      scan: null,
      positionCheck: null,
      heartbeat: null,
      metricsSnapshot: null,
      dailySummary: null,
    };
    this.state = stateManager.loadState();
    this.sessionStartTime = Date.now();
    this.lastMetricsAlert = 0;
  }

  /**
   * Initialize and start the daemon
   */
  async start() {
    try {
      // Validate configuration
      if (!validateConfig()) {
        throw new Error('Configuration validation failed');
      }

      this.isRunning = true;
      const restartCount = stateManager.incrementRestartCount();

      logger.info('🤖 Solana Momentum Trading Bot Daemon Starting...', {
        sessionId: this.state.sessionId,
        restartCount,
        previousSession: this.state.lastRestart,
      });

      // Log wallet info
      const solBalance = await tradeExecution.getSolBalance();
      logger.info(`Wallet SOL Balance: ${solBalance.toFixed(4)} SOL`);

      // Clear previous errors
      stateManager.clearError();

      // Start all monitoring loops
      this.startScanLoop();
      this.startPositionCheckLoop();
      this.startHeartbeatLoop();
      this.startMetricsSnapshotLoop();
      this.startDailySummaryLoop();

      // Setup graceful shutdown
      this.setupShutdownHandlers();

      logger.info('✅ Bot daemon started successfully. Monitoring for trading opportunities...');
      
      // Send startup alert
      await alerting.alertError('Bot Started', {
        'Session ID': this.state.sessionId,
        'Restart Count': restartCount.toString(),
        'Wallet Balance': `${solBalance.toFixed(4)} SOL`,
      });
    } catch (error) {
      logger.error('Failed to start bot daemon', error);
      stateManager.recordError(error, { phase: 'startup' });
      process.exit(1);
    }
  }

  /**
   * Start market scan loop - Every 10-30 seconds
   */
  startScanLoop() {
    this.intervals.scan = setInterval(() => {
      if (this.isRunning) {
        this.performScan();
      }
    }, config.strategy.scanIntervalSeconds * 1000);

    logger.info(`Scan loop started: Every ${config.strategy.scanIntervalSeconds} seconds`);
  }

  /**
   * Start position check loop - Every 10 seconds
   */
  startPositionCheckLoop() {
    this.intervals.positionCheck = setInterval(() => {
      if (this.isRunning) {
        this.checkOpenPositions();
      }
    }, 10000); // Every 10 seconds

    logger.info('Position check loop started: Every 10 seconds');
  }

  /**
   * Start heartbeat loop - Every 5 minutes
   */
  startHeartbeatLoop() {
    this.intervals.heartbeat = setInterval(() => {
      if (this.isRunning) {
        this.recordHeartbeat();
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    logger.info('Heartbeat loop started: Every 5 minutes');
  }

  /**
   * Start metrics snapshot loop - Every 30 minutes
   */
  startMetricsSnapshotLoop() {
    this.intervals.metricsSnapshot = setInterval(() => {
      if (this.isRunning) {
        this.snapshotMetrics();
      }
    }, 30 * 60 * 1000); // Every 30 minutes

    logger.info('Metrics snapshot loop started: Every 30 minutes');
  }

  /**
   * Start daily summary loop - Every 24 hours
   */
  startDailySummaryLoop() {
    this.intervals.dailySummary = setInterval(() => {
      if (this.isRunning) {
        this.sendDailySummary();
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    logger.info('Daily summary loop started: Every 24 hours');
  }

  /**
   * Perform token scanning and trading
   */
  async performScan() {
    try {
      // Screen tokens
      const screenedTokens = await jupiterData.screenTokens();
      
      this.state.scanCount = (this.state.scanCount || 0) + 1;

      if (screenedTokens.length === 0) {
        return;
      }

      logger.info(`Found ${screenedTokens.length} tokens meeting technical criteria`);

      // Filter by sentiment gates (ALL criteria required)
      const tradingCandidates = [];

      for (const token of screenedTokens.slice(0, 10)) {
        try {
          // Check sentiment gates
          const sentimentGates = await sentimentAnalysis.checkSentimentGates(
            token.symbol,
            token.address
          );

          if (!sentimentGates.allGatesPassed) {
            continue;
          }

          tradingCandidates.push({
            ...token,
            sentimentScore: sentimentGates.sentimentScore,
            trendingScore: sentimentGates.trendingScore,
          });
        } catch (error) {
          logger.warn(`Sentiment check failed for ${token.symbol}`, error);
          continue;
        }
      }

      logger.info(`${tradingCandidates.length} tokens passed ALL screening criteria`);

      // Attempt trades
      for (const candidate of tradingCandidates) {
        await this.attemptTrade(candidate);
      }
    } catch (error) {
      logger.error('Scan loop error', error);
      stateManager.recordError(error, { phase: 'scan' });
      await alerting.alertError('Scan Loop Error', { error: error.message });
    }
  }

  /**
   * Attempt to execute a trade on a candidate token
   */
  async attemptTrade(candidate) {
    try {
      // Check safeguards
      if (!this.checkTradeSafeguards()) {
        logger.warn('Trade safeguards triggered, skipping trade');
        return;
      }

      const { address, symbol, currentPrice, sentimentScore } = candidate;

      logger.info(`🎯 Trading opportunity: ${symbol}`, {
        sentiment: sentimentScore.toFixed(2),
        breakoutScore: candidate.breakoutScore.toFixed(2),
      });

      // Execute buy
      const buyResult = await tradeExecution.executeBuy(address, config.riskManagement.maxPositionSizeSol);

      if (!buyResult.success) {
        logger.warn(`Failed to execute buy for ${symbol}`, buyResult.error);
        return;
      }

      // Open position
      const position = positionManager.openPosition({
        tokenAddress: address,
        tokenSymbol: symbol,
        entryPrice: currentPrice,
        sizeSol: config.riskManagement.maxPositionSizeSol,
        transactionSignature: buyResult.signature,
      });

      this.state.tradeCount = (this.state.tradeCount || 0) + 1;

      // Save state
      stateManager.saveState(this.state);

      logger.log('trade', 'Trade Initiated', {
        token: symbol,
        positionId: position.id,
        entry: currentPrice.toFixed(6),
        size: position.sizeSol,
      });

      // Send alert
      await alerting.alertPositionOpened(position);
    } catch (error) {
      logger.error(`Trade attempt failed for ${candidate?.symbol}`, error);
      stateManager.recordError(error, { phase: 'trade', token: candidate?.symbol });
    }
  }

  /**
   * Check and manage open positions
   */
  async checkOpenPositions() {
    try {
      const openPositions = positionManager.getOpenPositions();

      if (openPositions.length === 0) {
        return;
      }

      for (const position of openPositions) {
        try {
          // Get current price
          const priceData = await jupiterData.getTokenPrice(position.tokenAddress);
          if (!priceData) continue;

          const currentPrice = priceData.price;

          // Update position
          positionManager.updatePosition(position.id, currentPrice);

          // Check exit conditions
          const exitCheck = positionManager.checkExitConditions(position.id);
          if (exitCheck && exitCheck.shouldExit) {
            // Execute exit
            await this.exitPosition(position, currentPrice, exitCheck.reason);
          }
        } catch (error) {
          logger.error(`Failed to check position ${position.id}`, error);
          stateManager.recordError(error, { phase: 'positionCheck', positionId: position.id });
        }
      }

      // Check portfolio safeguards
      if (positionManager.checkPortfolioStopLoss()) {
        await this.handlePortfolioStopLoss();
      }

      if (positionManager.checkDailyLossLimit()) {
        await this.handleDailyLossLimit();
      }
    } catch (error) {
      logger.error('Position check loop error', error);
      stateManager.recordError(error, { phase: 'positionCheck' });
    }
  }

  /**
   * Exit a position
   */
  async exitPosition(position, exitPrice, reason) {
    try {
      logger.info(`Exiting position ${position.id} (${reason})`);

      // Calculate token amount to sell
      const tokenAmount = position.sizeSol / position.entryPrice;

      // Execute sell
      const sellResult = await tradeExecution.executeSell(position.tokenAddress, tokenAmount);

      if (!sellResult.success) {
        logger.error(`Failed to exit position ${position.id}`, sellResult.error);
        return;
      }

      // Close position
      positionManager.closePosition(position.id, exitPrice, reason);

      // Get closed position
      const closedPosition = positionManager.positions.find(p => p.id === position.id);

      // Save state
      stateManager.saveState(this.state);

      logger.log('trade', 'Position Exit Summary', {
        token: position.tokenSymbol,
        entry: position.entryPrice.toFixed(6),
        exit: exitPrice.toFixed(6),
        pnl: closedPosition.pnl.toFixed(4),
        pnlPercent: closedPosition.pnlPercent.toFixed(2),
        reason,
      });

      // Send alert
      await alerting.alertPositionClosed(closedPosition);
    } catch (error) {
      logger.error(`Exit execution failed for ${position.id}`, error);
      stateManager.recordError(error, { phase: 'exit', positionId: position.id });
    }
  }

  /**
   * Record heartbeat - Proof of life signal every 5 minutes
   */
  recordHeartbeat() {
    try {
      const metrics = positionManager.getPortfolioMetrics();
      const openPositions = positionManager.getOpenPositions();

      const heartbeatData = {
        status: 'alive',
        uptime: process.uptime(),
        scanCount: this.state.scanCount || 0,
        tradeCount: this.state.tradeCount || 0,
        openPositions: openPositions.length,
        portfolio: metrics,
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      };

      stateManager.recordHeartbeat(heartbeatData);
      logger.debug('✓ Heartbeat recorded', heartbeatData);
    } catch (error) {
      logger.error('Failed to record heartbeat', error);
    }
  }

  /**
   * Snapshot metrics every 30 minutes
   */
  snapshotMetrics() {
    try {
      const metrics = positionManager.getPortfolioMetrics();
      stateManager.saveMetrics(metrics);

      // Send alert every 2 hours
      const now = Date.now();
      if (now - this.lastMetricsAlert > 2 * 60 * 60 * 1000) {
        alerting.alertPortfolioMetrics(metrics);
        this.lastMetricsAlert = now;
      }

      logger.info('📊 Metrics snapshot saved', {
        totalPnl: metrics.totalPnl.toFixed(4),
        winRate: metrics.winRate.toFixed(1),
        openPositions: metrics.openPositionsCount,
      });
    } catch (error) {
      logger.error('Failed to snapshot metrics', error);
    }
  }

  /**
   * Send daily summary every 24 hours
   */
  async sendDailySummary() {
    try {
      const closedToday = positionManager.getClosedPositions().filter(p => {
        const tradeDate = new Date(p.exitTime).toDateString();
        return tradeDate === new Date().toDateString();
      });

      const summary = {
        trades: closedToday.length,
        wins: closedToday.filter(p => p.pnl > 0).length,
        losses: closedToday.filter(p => p.pnl < 0).length,
        dailyPnl: closedToday.reduce((sum, p) => sum + p.pnl, 0),
        winRate: closedToday.length > 0 
          ? (closedToday.filter(p => p.pnl > 0).length / closedToday.length) * 100 
          : 0,
      };

      await alerting.alertDailySummary(summary);

      logger.info('📅 Daily summary sent', summary);
    } catch (error) {
      logger.error('Failed to send daily summary', error);
    }
  }

  /**
   * Check trade safeguards
   */
  checkTradeSafeguards() {
    try {
      if (!config.advanced.enableSafeguards) {
        return true;
      }

      // Check portfolio safeguards
      if (positionManager.checkPortfolioStopLoss()) {
        return false;
      }

      if (positionManager.checkDailyLossLimit()) {
        return false;
      }

      // Check position limits
      const openPositions = positionManager.getOpenPositions();
      if (openPositions.length >= config.riskManagement.maxSimultaneousPositions) {
        logger.debug('Max simultaneous positions reached');
        return false;
      }

      // Check capital limits
      const totalDeployed = openPositions.reduce((sum, p) => sum + p.sizeSol, 0);
      if (totalDeployed + config.riskManagement.maxPositionSizeSol > config.riskManagement.startingCapitalSol) {
        logger.debug('Insufficient available capital');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Safeguard check failed', error);
      return false;
    }
  }

  /**
   * Handle portfolio stop loss trigger
   */
  async handlePortfolioStopLoss() {
    try {
      logger.error('🚨 PORTFOLIO STOP LOSS TRIGGERED!');
      await alerting.alertSafeguardTriggered('portfolio_stop_loss', {
        'Total Loss': `${positionManager.getPortfolioMetrics().totalPnl.toFixed(4)} SOL`,
        'Max Allowed': `${config.riskManagement.startingCapitalSol * (config.riskManagement.portfolioStopLossPercent / 100)} SOL`,
      });

      await this.emergencyCloseAllPositions();
    } catch (error) {
      logger.error('Failed to handle portfolio stop loss', error);
    }
  }

  /**
   * Handle daily loss limit trigger
   */
  async handleDailyLossLimit() {
    try {
      logger.warn('Daily loss limit reached, pausing new trades');
      await alerting.alertSafeguardTriggered('daily_loss_limit', {
        'Max Daily Loss': `${config.riskManagement.maxDailyLossSol} SOL`,
      });

      this.isRunning = false;
    } catch (error) {
      logger.error('Failed to handle daily loss limit', error);
    }
  }

  /**
   * Emergency close all positions
   */
  async emergencyCloseAllPositions() {
    try {
      const openPositions = positionManager.getOpenPositions();

      for (const position of openPositions) {
        try {
          const priceData = await jupiterData.getTokenPrice(position.tokenAddress);
          if (!priceData) continue;

          await this.exitPosition(position, priceData.price, 'emergency_close');
        } catch (error) {
          logger.error(`Emergency close failed for ${position.id}`, error);
        }
      }

      this.isRunning = false;
      logger.warn('All positions closed. Bot halted.');
    } catch (error) {
      logger.error('Emergency close failed', error);
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupShutdownHandlers() {
    const shutdownGracefully = async (signal) => {
      logger.info(`\n${signal} received. Closing positions and shutting down...`);
      this.isRunning = false;

      // Clear all intervals
      Object.values(this.intervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });

      // Close open positions
      const openPositions = positionManager.getOpenPositions();
      if (openPositions.length > 0) {
        logger.info(`Closing ${openPositions.length} open positions...`);
        for (const position of openPositions) {
          try {
            const priceData = await jupiterData.getTokenPrice(position.tokenAddress);
            if (priceData) {
              await this.exitPosition(position, priceData.price, 'manual_shutdown');
            }
          } catch (error) {
            logger.error(`Failed to close position during shutdown`, error);
          }
        }
      }

      // Log final metrics
      const metrics = positionManager.getPortfolioMetrics();
      logger.info('Final Portfolio Metrics:', metrics);

      // Save final state
      this.state.isRunning = false;
      this.state.lastShutdown = new Date().toISOString();
      stateManager.saveState(this.state);

      // Record final heartbeat
      this.recordHeartbeat();

      logger.info('✅ Bot daemon shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdownGracefully('SIGINT'));
    process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      stateManager.recordError(error, { phase: 'uncaughtException' });
      // Continue running instead of crashing
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      stateManager.recordError(new Error(String(reason)), { phase: 'unhandledRejection' });
      // Continue running instead of crashing
    });
  }

  /**
   * Get bot status
   */
  getStatus() {
    const metrics = positionManager.getPortfolioMetrics();
    return {
      running: this.isRunning,
      sessionId: this.state.sessionId,
      uptime: process.uptime(),
      scanCount: this.state.scanCount,
      tradeCount: this.state.tradeCount,
      metrics,
      lastHeartbeat: stateManager.getLastHeartbeat(),
    };
  }
}

/**
 * Start the daemon
 */
const bot = new SolanaMomentumBotDaemon();
bot.start().catch(error => {
  logger.error('Fatal error', error);
  stateManager.recordError(error, { phase: 'startup' });
  process.exit(1);
});

// Export for testing and monitoring
export default bot;
