import logger from './logger.js';
import config from './config.js';
import { validateConfig } from './config.js';
import jupiterData from './jupiterData.js';
import sentimentAnalysis from './sentimentAnalysis.js';
import positionManager from './positionManager.js';
import tradeExecution from './tradeExecution.js';

/**
 * Main Trading Bot Class
 */
class SolanaMomentumBot {
  constructor() {
    this.isRunning = false;
    this.scanInterval = null;
    this.lastScannedTokens = [];
    this.tokenCache = new Map();
    this.maxCacheAge = 60000; // 1 minute
  }

  /**
   * Initialize and start the bot
   */
  async start() {
    try {
      // Validate configuration
      if (!validateConfig()) {
        throw new Error('Configuration validation failed');
      }

      this.isRunning = true;
      logger.info('🤖 Solana Momentum Trading Bot Starting...');
      logger.info(`Configuration: ${JSON.stringify({
        strategy: config.strategy,
        riskManagement: config.riskManagement,
        execution: config.execution,
      }, null, 2)}`);

      // Log wallet info
      const solBalance = await tradeExecution.getSolBalance();
      logger.info(`Wallet SOL Balance: ${solBalance.toFixed(4)} SOL`);

      // Start the scanning loop
      this.startScanLoop();

      // Setup graceful shutdown
      this.setupShutdownHandlers();

      logger.info('✅ Bot started successfully. Monitoring for trading opportunities...');
    } catch (error) {
      logger.error('Failed to start bot', error);
      process.exit(1);
    }
  }

  /**
   * Start the main scanning loop
   */
  startScanLoop() {
    // Initial scan
    this.performScan();

    // Schedule recurring scans
    this.scanInterval = setInterval(() => {
      if (this.isRunning) {
        this.performScan();
      }
    }, config.strategy.scanIntervalSeconds * 1000);

    // Also check positions on a faster interval
    setInterval(() => {
      if (this.isRunning) {
        this.checkOpenPositions();
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Perform token scanning and trading decision
   */
  async performScan() {
    try {
      logger.debug('🔍 Starting token scan...');

      // Screen tokens
      const screenedTokens = await jupiterData.screenTokens();
      if (screenedTokens.length === 0) {
        logger.debug('No tokens passed screening criteria');
        return;
      }

      logger.info(`Found ${screenedTokens.length} tokens meeting technical criteria`);

      // Filter by sentiment gates (ALL criteria required)
      const tradingCandidates = [];

      for (const token of screenedTokens.slice(0, 10)) { // Check top 10 only
        try {
          // Check sentiment gates
          const sentimentGates = await sentimentAnalysis.checkSentimentGates(
            token.symbol,
            token.address
          );

          if (!sentimentGates.allGatesPassed) {
            logger.debug(`${token.symbol} failed sentiment gates`, sentimentGates);
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

      logger.info(`${tradingCandidates.length} tokens passed ALL screening criteria (technical + sentiment)`);

      // Attempt trades
      for (const candidate of tradingCandidates) {
        await this.attemptTrade(candidate);
      }
    } catch (error) {
      logger.error('Scan loop error', error);
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
        volumeScore: candidate.buyVolumeScore.toFixed(2),
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

      logger.log('trade', 'Trade Initiated', {
        token: symbol,
        positionId: position.id,
        entry: currentPrice.toFixed(6),
        size: position.sizeSol,
        stopLoss: position.stopLossPrice.toFixed(6),
        takeProfit: position.takeProfitPrice.toFixed(6),
      });
    } catch (error) {
      logger.error(`Trade attempt failed for ${candidate?.symbol}`, error);
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
        }
      }

      // Check portfolio safeguards
      if (positionManager.checkPortfolioStopLoss()) {
        await this.emergencyCloseAllPositions();
      }

      if (positionManager.checkDailyLossLimit()) {
        logger.warn('Daily loss limit reached, pausing new trades');
        this.isRunning = false;
      }
    } catch (error) {
      logger.error('Position check loop error', error);
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

      // Log result
      const closedPosition = positionManager.positions.find(p => p.id === position.id);
      logger.log('trade', 'Position Exit Summary', {
        token: position.tokenSymbol,
        entry: position.entryPrice.toFixed(6),
        exit: exitPrice.toFixed(6),
        pnl: closedPosition.pnl.toFixed(4),
        pnlPercent: closedPosition.pnlPercent.toFixed(2),
        reason,
      });
    } catch (error) {
      logger.error(`Exit execution failed for ${position.id}`, error);
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
   * Emergency close all positions (portfolio stop loss)
   */
  async emergencyCloseAllPositions() {
    try {
      logger.error('🚨 EMERGENCY CLOSE: Portfolio stop loss triggered!');
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

      if (this.scanInterval) {
        clearInterval(this.scanInterval);
      }

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

      logger.info('✅ Bot shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdownGracefully('SIGINT'));
    process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
  }

  /**
   * Get bot status
   */
  getStatus() {
    const metrics = positionManager.getPortfolioMetrics();
    return {
      running: this.isRunning,
      metrics,
      configuration: config,
    };
  }
}

/**
 * Start the bot
 */
const bot = new SolanaMomentumBot();
bot.start().catch(error => {
  logger.error('Fatal error', error);
  process.exit(1);
});

// Export for testing
export default bot;
