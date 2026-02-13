import logger from './logger.js';
import config from './config.js';
import { validateConfig } from './config.js';
import jupiterData from './jupiterData.js';
import sentimentAnalysis from './sentimentAnalysis.js';
import positionManager from './positionManager.js';
import tradeExecution from './tradeExecution.js';
import stateManager from './stateManager.js';
import alerting from './alerting.js';
import heartbeat from './heartbeat.js';

/**
 * Solana Momentum Trading Bot - Production Daemon
 * 
 * Core Responsibilities:
 * - Market scanning: Every 10-30 seconds
 * - Position management: Every 10 seconds
 * - Heartbeat logging: Every 5 minutes
 * - State persistence: After every trade
 * - Error recovery: Auto-retry on transient failures
 * - Graceful shutdown: SIGTERM/SIGINT handling
 */
class SolanaTradingDaemon {
  constructor() {
    this.isRunning = false;
    this.isShuttingDown = false;
    this.intervals = {
      scan: null,
      positionCheck: null,
      heartbeat: null,
      metricsSnapshot: null,
      dailySummary: null,
      errorRecovery: null,
    };
    this.state = stateManager.loadState();
    this.sessionStartTime = Date.now();
    this.stats = {
      scans: 0,
      trades: 0,
      errors: 0,
      recoveries: 0,
      lastErrorTime: null,
    };
    this.errorRetryCount = 0;
    this.maxConsecutiveErrors = 10;
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

      logger.info('═══════════════════════════════════════════════════════════════');
      logger.info('🤖 Solana Momentum Trading Bot Daemon v1.0.0');
      logger.info('═══════════════════════════════════════════════════════════════');
      logger.info('Starting Daemon...', {
        sessionId: this.state.sessionId,
        restartCount,
        timestamp: new Date().toISOString(),
      });

      // Log wallet info
      const solBalance = await tradeExecution.getSolBalance();
      logger.info(`💰 Wallet Balance: ${solBalance.toFixed(4)} SOL`, {
        timestamp: new Date().toISOString(),
      });

      // Clear previous error state
      stateManager.clearError();

      // Initialize heartbeat system
      heartbeat.initialize({
        sessionId: this.state.sessionId,
        restartCount,
        walletBalance: solBalance,
      });

      // Record startup heartbeat
      this.recordHeartbeat();

      // Start all monitoring loops
      this.startScanLoop();
      this.startPositionCheckLoop();
      this.startHeartbeatLoop();
      this.startMetricsSnapshotLoop();
      this.startDailySummaryLoop();
      this.startErrorRecoveryLoop();

      // Setup graceful shutdown
      this.setupShutdownHandlers();

      logger.info('═══════════════════════════════════════════════════════════════');
      logger.info('✅ Bot daemon started successfully!');
      logger.info('═══════════════════════════════════════════════════════════════');
      logger.info(`Market Scan Interval: ${config.strategy.scanIntervalSeconds}s`);
      logger.info(`Position Check Interval: 10s`);
      logger.info(`Heartbeat Interval: 5m`);
      logger.info('Monitoring for trading opportunities...\n');

      // Send startup notification
      await alerting.alertError('✅ Bot Started', {
        'Session ID': this.state.sessionId,
        'Restart Count': restartCount.toString(),
        'Wallet Balance': `${solBalance.toFixed(4)} SOL`,
        'Timestamp': new Date().toISOString(),
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
    const scanInterval = config.strategy.scanIntervalSeconds * 1000;
    
    this.intervals.scan = setInterval(() => {
      if (this.isRunning && !this.isShuttingDown) {
        this.performScan().catch(error => {
          logger.error('Uncaught error in scan loop', error);
          this.handleLoopError('scan', error);
        });
      }
    }, scanInterval);

    logger.info(`📊 Scan loop started: Every ${config.strategy.scanIntervalSeconds}s`);
  }

  /**
   * Start position check loop - Every 10 seconds
   */
  startPositionCheckLoop() {
    this.intervals.positionCheck = setInterval(() => {
      if (this.isRunning && !this.isShuttingDown) {
        this.checkOpenPositions().catch(error => {
          logger.error('Uncaught error in position check loop', error);
          this.handleLoopError('positionCheck', error);
        });
      }
    }, 10000); // Every 10 seconds

    logger.info('📍 Position check loop started: Every 10s');
  }

  /**
   * Start heartbeat loop - Every 5 minutes
   */
  startHeartbeatLoop() {
    this.intervals.heartbeat = setInterval(() => {
      if (this.isRunning && !this.isShuttingDown) {
        this.recordHeartbeat();
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    logger.info('❤️  Heartbeat loop started: Every 5m');
  }

  /**
   * Start metrics snapshot loop - Every 30 minutes
   */
  startMetricsSnapshotLoop() {
    this.intervals.metricsSnapshot = setInterval(() => {
      if (this.isRunning && !this.isShuttingDown) {
        this.snapshotMetrics();
      }
    }, 30 * 60 * 1000); // Every 30 minutes

    logger.info('📈 Metrics snapshot loop started: Every 30m');
  }

  /**
   * Start daily summary loop - Every 24 hours
   */
  startDailySummaryLoop() {
    this.intervals.dailySummary = setInterval(() => {
      if (this.isRunning && !this.isShuttingDown) {
        this.sendDailySummary();
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    logger.info('📅 Daily summary loop started: Every 24h');
  }

  /**
   * Start error recovery loop - Monitor and recover from failures
   */
  startErrorRecoveryLoop() {
    this.intervals.errorRecovery = setInterval(() => {
      if (this.isRunning && !this.isShuttingDown) {
        this.checkErrorRecovery();
      }
    }, 60000); // Every minute

    logger.info('🔄 Error recovery loop started: Every 60s');
  }

  /**
   * Perform token scanning and trading
   */
  async performScan() {
    try {
      this.stats.scans++;

      // Screen tokens
      const screenedTokens = await jupiterData.screenTokens();

      if (screenedTokens.length === 0) {
        return;
      }

      logger.debug(`Found ${screenedTokens.length} tokens meeting technical criteria`);

      // Filter by sentiment gates
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

      if (tradingCandidates.length > 0) {
        logger.info(`🎯 ${tradingCandidates.length} tokens passed ALL screening criteria`);

        // Attempt trades
        for (const candidate of tradingCandidates) {
          await this.attemptTrade(candidate);
        }
      }

      // Reset error counter on successful scan
      this.errorRetryCount = 0;
    } catch (error) {
      logger.error('Scan loop error', error);
      this.handleLoopError('scan', error);
    }
  }

  /**
   * Attempt to execute a trade on a candidate token
   */
  async attemptTrade(candidate) {
    try {
      // Check safeguards
      if (!this.checkTradeSafeguards()) {
        logger.debug('Trade safeguards triggered, skipping trade');
        return;
      }

      const { address, symbol, currentPrice, sentimentScore } = candidate;

      logger.info(`📈 Trading opportunity: ${symbol}`, {
        sentiment: sentimentScore.toFixed(2),
        breakoutScore: candidate.breakoutScore?.toFixed(2) || 'N/A',
        volumeScore: candidate.buyVolumeScore?.toFixed(2) || 'N/A',
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

      this.stats.trades++;
      this.state.tradeCount = (this.state.tradeCount || 0) + 1;

      // Save state
      stateManager.saveState(this.state);

      logger.log('trade', 'Position Opened', {
        token: symbol,
        positionId: position.id,
        entry: currentPrice.toFixed(6),
        size: position.sizeSol,
        stopLoss: position.stopLossPrice?.toFixed(6) || 'N/A',
        takeProfit: position.takeProfitPrice?.toFixed(6) || 'N/A',
        timestamp: new Date().toISOString(),
      });

      // Send alert
      await alerting.alertPositionOpened(position);
    } catch (error) {
      logger.error(`Trade attempt failed for ${candidate?.symbol}`, error);
      this.handleLoopError('trade', error);
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
            await this.exitPosition(position, currentPrice, exitCheck.reason);
          }
        } catch (error) {
          logger.error(`Failed to check position ${position.id}`, error);
        }
      }

      // Check portfolio safeguards
      if (positionManager.checkPortfolioStopLoss()) {
        await this.handlePortfolioStopLoss();
      }

      if (positionManager.checkDailyLossLimit()) {
        await this.handleDailyLossLimit();
      }

      // Reset error counter on successful position check
      this.errorRetryCount = 0;
    } catch (error) {
      logger.error('Position check loop error', error);
      this.handleLoopError('positionCheck', error);
    }
  }

  /**
   * Exit a position
   */
  async exitPosition(position, exitPrice, reason) {
    try {
      logger.info(`Exiting position ${position.id} (${reason})`, {
        token: position.tokenSymbol,
        exitPrice: exitPrice.toFixed(6),
      });

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

      logger.log('trade', 'Position Closed', {
        token: position.tokenSymbol,
        entry: position.entryPrice.toFixed(6),
        exit: exitPrice.toFixed(6),
        pnl: closedPosition?.pnl?.toFixed(4) || 'N/A',
        pnlPercent: closedPosition?.pnlPercent?.toFixed(2) || 'N/A',
        reason,
        timestamp: new Date().toISOString(),
      });

      // Send alert
      if (closedPosition) {
        await alerting.alertPositionClosed(closedPosition);
      }
    } catch (error) {
      logger.error(`Exit execution failed for ${position.id}`, error);
      this.handleLoopError('exit', error);
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
        scanCount: this.stats.scans,
        tradeCount: this.stats.trades,
        openPositions: openPositions.length,
        portfolio: {
          totalPnl: metrics.totalPnl,
          totalPnlPercent: metrics.totalPnlPercent,
          openPositionsCount: metrics.openPositionsCount,
          closedPositionsCount: metrics.closedPositionsCount,
          winRate: metrics.winRate,
          avgWin: metrics.avgWin,
          avgLoss: metrics.avgLoss,
        },
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
        errors: this.stats.errors,
        recoveries: this.stats.recoveries,
      };

      heartbeat.recordHeartbeat(heartbeatData);
      stateManager.recordHeartbeat(heartbeatData);

      logger.debug('✓ Heartbeat recorded', {
        uptime: `${(process.uptime() / 60).toFixed(1)}m`,
        openPositions: openPositions.length,
        memory: `${heartbeatData.memory.heapUsed}MB/${heartbeatData.memory.heapTotal}MB`,
      });
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

      logger.info('📊 Metrics snapshot saved', {
        totalPnl: `$${metrics.totalPnl.toFixed(4)}`,
        winRate: `${metrics.winRate.toFixed(1)}%`,
        openPositions: metrics.openPositionsCount,
        closedPositions: metrics.closedPositionsCount,
      });

      // Send alert every 2 hours
      const lastMetricsAlert = parseInt(this.state.lastMetricsAlert || '0');
      const now = Date.now();
      if (now - lastMetricsAlert > 2 * 60 * 60 * 1000) {
        alerting.alertPortfolioMetrics(metrics);
        this.state.lastMetricsAlert = now.toString();
        stateManager.saveState(this.state);
      }
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
   * Check error recovery and auto-recovery logic
   */
  checkErrorRecovery() {
    try {
      const lastHeartbeat = stateManager.getLastHeartbeat();
      const now = Date.now();

      if (lastHeartbeat) {
        const lastBeat = new Date(lastHeartbeat.timestamp).getTime();
        const timeSinceLastBeat = now - lastBeat;

        // If no heartbeat in 6 minutes, something is wrong
        if (timeSinceLastBeat > 6 * 60 * 1000) {
          logger.warn('No heartbeat received in 6+ minutes. Possible hang detected.');
          this.stats.recoveries++;
        }
      }

      // Log error recovery status
      if (this.errorRetryCount > 0) {
        logger.info(`Error recovery in progress: ${this.errorRetryCount}/${this.maxConsecutiveErrors} errors`, {
          lastError: this.stats.lastErrorTime,
        });
      }
    } catch (error) {
      logger.error('Error in recovery check', error);
    }
  }

  /**
   * Handle loop errors with retry logic
   */
  handleLoopError(loopName, error) {
    try {
      this.stats.errors++;
      this.stats.lastErrorTime = new Date().toISOString();
      this.errorRetryCount++;

      // Log the error
      logger.error(`${loopName} loop encountered an error`, {
        error: error.message,
        errorCount: this.errorRetryCount,
        maxRetries: this.maxConsecutiveErrors,
      });

      // Record error in state
      stateManager.recordError(error, { phase: loopName, loop: true });

      // If too many consecutive errors, trigger alert
      if (this.errorRetryCount >= this.maxConsecutiveErrors) {
        logger.error(`🚨 CRITICAL: ${loopName} loop has failed ${this.errorRetryCount} times!`);
        alerting.alertError(`🚨 Loop Failure: ${loopName}`, {
          'Consecutive Errors': this.errorRetryCount.toString(),
          'Max Allowed': this.maxConsecutiveErrors.toString(),
          'Last Error': error.message,
        });

        // Don't stop the daemon, but flag it
        if (this.errorRetryCount > this.maxConsecutiveErrors + 5) {
          logger.error('EMERGENCY STOP: Too many consecutive errors!');
          this.isRunning = false;
        }
      }
    } catch (err) {
      logger.error('Failed to handle loop error', err);
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
      const metrics = positionManager.getPortfolioMetrics();

      await alerting.alertSafeguardTriggered('portfolio_stop_loss', {
        'Total Loss': `${metrics.totalPnl.toFixed(4)} SOL`,
        'Max Allowed': `${(config.riskManagement.startingCapitalSol * (config.riskManagement.portfolioStopLossPercent / 100)).toFixed(4)} SOL`,
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
      logger.info(`\n${'═'.repeat(63)}`);
      logger.info(`⏹️  ${signal} received. Graceful shutdown initiated...`);
      logger.info(`${'═'.repeat(63)}`);

      this.isRunning = false;
      this.isShuttingDown = true;

      // Clear all intervals
      Object.values(this.intervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });

      logger.info('⏳ Waiting for pending operations to complete...');

      // Give pending operations 5 seconds to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Close open positions
      const openPositions = positionManager.getOpenPositions();
      if (openPositions.length > 0) {
        logger.info(`📍 Closing ${openPositions.length} open positions...`);
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

      // Record final metrics
      this.recordHeartbeat();

      // Log final metrics
      const metrics = positionManager.getPortfolioMetrics();
      logger.info('📊 Final Portfolio Metrics:', metrics);

      // Save final state
      this.state.isRunning = false;
      this.state.lastShutdown = new Date().toISOString();
      this.state.sessionDuration = Date.now() - this.sessionStartTime;
      stateManager.saveState(this.state);

      logger.info(`${'═'.repeat(63)}`);
      logger.info('✅ Bot daemon shutdown complete');
      logger.info(`Session Duration: ${(this.state.sessionDuration / 1000 / 60).toFixed(2)} minutes`);
      logger.info(`Total Trades: ${this.stats.trades}`);
      logger.info(`Total Errors: ${this.stats.errors}`);
      logger.info(`${'═'.repeat(63)}\n`);

      process.exit(0);
    };

    process.on('SIGINT', () => shutdownGracefully('SIGINT'));
    process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('🚨 Uncaught Exception', error);
      stateManager.recordError(error, { phase: 'uncaughtException', fatal: true });
      this.stats.errors++;
      alerting.alertError('⚠️ Uncaught Exception', {
        error: error.message,
        stack: error.stack?.split('\n')[0] || 'Unknown',
      });
      // Continue running instead of crashing
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('⚠️ Unhandled Rejection', { reason: String(reason), promise: String(promise) });
      stateManager.recordError(new Error(String(reason)), { 
        phase: 'unhandledRejection',
        promiseInfo: String(promise),
      });
      this.stats.errors++;
      // Continue running instead of crashing
    });
  }

  /**
   * Get bot status
   */
  getStatus() {
    const metrics = positionManager.getPortfolioMetrics();
    const uptime = process.uptime();
    return {
      running: this.isRunning,
      shutting_down: this.isShuttingDown,
      sessionId: this.state.sessionId,
      uptime: `${(uptime / 60).toFixed(2)} minutes`,
      uptimeSeconds: uptime,
      stats: this.stats,
      metrics,
      lastHeartbeat: stateManager.getLastHeartbeat(),
      memory: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      },
    };
  }
}

/**
 * Create and start the daemon
 */
const daemon = new SolanaTradingDaemon();
daemon.start().catch(error => {
  logger.error('Fatal error during startup', error);
  stateManager.recordError(error, { phase: 'startup', fatal: true });
  process.exit(1);
});

// Export for testing and monitoring
export default daemon;
