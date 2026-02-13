import logger from './logger.js';
import config from './config.js';
import fs from 'fs';
import path from 'path';

class PositionManager {
  constructor() {
    this.positions = [];
    this.positionsFilePath = path.join(process.cwd(), 'data', 'positions.json');
    this.loadPositions();
  }

  /**
   * Load positions from persistent storage
   */
  loadPositions() {
    try {
      if (fs.existsSync(this.positionsFilePath)) {
        const data = fs.readFileSync(this.positionsFilePath, 'utf8');
        this.positions = JSON.parse(data);
        logger.info(`Loaded ${this.positions.length} existing positions`);
      }
    } catch (error) {
      logger.error('Failed to load positions', error);
      this.positions = [];
    }
  }

  /**
   * Save positions to persistent storage
   */
  savePositions() {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.positionsFilePath, JSON.stringify(this.positions, null, 2));
    } catch (error) {
      logger.error('Failed to save positions', error);
    }
  }

  /**
   * Open a new position
   */
  openPosition(positionData) {
    try {
      // Validate position size
      if (positionData.sizeSol > config.riskManagement.maxPositionSizeSol) {
        throw new Error(`Position size ${positionData.sizeSol} exceeds max ${config.riskManagement.maxPositionSizeSol}`);
      }

      // Check max simultaneous positions
      const openCount = this.positions.filter(p => p.status === 'open').length;
      if (openCount >= config.riskManagement.maxSimultaneousPositions) {
        throw new Error(`Maximum ${config.riskManagement.maxSimultaneousPositions} open positions reached`);
      }

      const position = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tokenAddress: positionData.tokenAddress,
        tokenSymbol: positionData.tokenSymbol,
        entryPrice: positionData.entryPrice,
        sizeSol: positionData.sizeSol,
        entryTime: Date.now(),
        status: 'open',
        stopLossPrice: positionData.entryPrice * (1 + config.riskManagement.stopLossPercent / 100),
        takeProfitPrice: positionData.entryPrice * (1 + config.riskManagement.takeProfitPercent / 100),
        transactionSignature: positionData.transactionSignature || null,
        pnl: 0,
        pnlPercent: 0,
        currentPrice: positionData.entryPrice,
      };

      this.positions.push(position);
      this.savePositions();

      logger.log('trade', 'Position Opened', {
        positionId: position.id,
        token: position.tokenSymbol,
        size: position.sizeSol,
        entryPrice: position.entryPrice,
        stopLoss: position.stopLossPrice,
        takeProfit: position.takeProfitPrice,
      });

      return position;
    } catch (error) {
      logger.error('Failed to open position', error);
      throw error;
    }
  }

  /**
   * Update position with current price
   */
  updatePosition(positionId, currentPrice) {
    try {
      const position = this.positions.find(p => p.id === positionId);
      if (!position) {
        throw new Error(`Position ${positionId} not found`);
      }

      const previousPnl = position.pnl;
      position.currentPrice = currentPrice;
      position.pnl = (currentPrice - position.entryPrice) * (position.sizeSol / position.entryPrice);
      position.pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

      // Check if PnL changed significantly (for logging purposes)
      if (Math.abs(position.pnl - previousPnl) > 0.01) {
        logger.debug(`Position ${position.tokenSymbol} P&L: ${position.pnlPercent.toFixed(2)}%`);
      }

      return position;
    } catch (error) {
      logger.error(`Failed to update position ${positionId}`, error);
      return null;
    }
  }

  /**
   * Check if position should be closed (stop loss or take profit)
   */
  checkExitConditions(positionId) {
    try {
      const position = this.positions.find(p => p.id === positionId && p.status === 'open');
      if (!position) return null;

      const exitReason = this.getExitReason(position);
      if (exitReason) {
        return {
          shouldExit: true,
          reason: exitReason,
          position,
        };
      }

      return { shouldExit: false, position };
    } catch (error) {
      logger.error(`Failed to check exit conditions for ${positionId}`, error);
      return null;
    }
  }

  /**
   * Determine exit reason
   */
  getExitReason(position) {
    if (position.currentPrice <= position.stopLossPrice) {
      return 'stop_loss';
    }
    if (position.currentPrice >= position.takeProfitPrice) {
      return 'take_profit';
    }
    return null;
  }

  /**
   * Close a position
   */
  closePosition(positionId, exitPrice, reason = 'manual') {
    try {
      const position = this.positions.find(p => p.id === positionId);
      if (!position) {
        throw new Error(`Position ${positionId} not found`);
      }

      position.status = 'closed';
      position.currentPrice = exitPrice;
      position.exitPrice = exitPrice;
      position.exitTime = Date.now();
      position.exitReason = reason;
      position.pnl = (exitPrice - position.entryPrice) * (position.sizeSol / position.entryPrice);
      position.pnlPercent = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
      position.duration = position.exitTime - position.entryTime;

      this.savePositions();

      logger.log('trade', 'Position Closed', {
        positionId: position.id,
        token: position.tokenSymbol,
        entryPrice: position.entryPrice,
        exitPrice: position.exitPrice,
        pnl: position.pnl,
        pnlPercent: position.pnlPercent.toFixed(2),
        reason,
        duration: `${(position.duration / 1000 / 60).toFixed(2)}min`,
      });

      return position;
    } catch (error) {
      logger.error(`Failed to close position ${positionId}`, error);
      throw error;
    }
  }

  /**
   * Get all open positions
   */
  getOpenPositions() {
    return this.positions.filter(p => p.status === 'open');
  }

  /**
   * Get all closed positions
   */
  getClosedPositions() {
    return this.positions.filter(p => p.status === 'closed');
  }

  /**
   * Calculate portfolio metrics
   */
  getPortfolioMetrics() {
    try {
      const openPositions = this.getOpenPositions();
      const closedPositions = this.getClosedPositions();

      const totalCapitalDeployed = openPositions.reduce((sum, p) => sum + p.sizeSol, 0);
      const totalRealizedPnl = closedPositions.reduce((sum, p) => sum + p.pnl, 0);
      const totalUnrealizedPnl = openPositions.reduce((sum, p) => sum + p.pnl, 0);
      const totalPnl = totalRealizedPnl + totalUnrealizedPnl;
      const winningTrades = closedPositions.filter(p => p.pnl > 0).length;
      const losingTrades = closedPositions.filter(p => p.pnl < 0).length;
      const winRate = closedPositions.length > 0 ? (winningTrades / closedPositions.length) * 100 : 0;

      return {
        totalCapitalDeployed,
        totalRealizedPnl,
        totalUnrealizedPnl,
        totalPnl,
        totalPnlPercent: (totalPnl / config.riskManagement.startingCapitalSol) * 100,
        openPositionsCount: openPositions.length,
        closedPositionsCount: closedPositions.length,
        winningTrades,
        losingTrades,
        winRate,
        avgPnlPerTrade: closedPositions.length > 0 ? totalRealizedPnl / closedPositions.length : 0,
      };
    } catch (error) {
      logger.error('Failed to calculate portfolio metrics', error);
      return null;
    }
  }

  /**
   * Check portfolio stop loss (kill switch)
   */
  checkPortfolioStopLoss() {
    try {
      const metrics = this.getPortfolioMetrics();
      if (!metrics) return false;

      const totalLoss = metrics.totalPnl;
      const maxAllowedLoss = config.riskManagement.startingCapitalSol * 
                             (config.riskManagement.portfolioStopLossPercent / 100);

      if (totalLoss <= maxAllowedLoss) {
        logger.warn('🚨 PORTFOLIO STOP LOSS TRIGGERED!', {
          totalLoss,
          maxAllowedLoss,
          pnlPercent: metrics.totalPnlPercent,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to check portfolio stop loss', error);
      return false;
    }
  }

  /**
   * Check daily loss limit
   */
  checkDailyLossLimit() {
    try {
      const today = new Date().toDateString();
      const todaysTrades = this.positions.filter(p => {
        const tradeDate = new Date(p.entryTime).toDateString();
        return tradeDate === today && p.status === 'closed' && p.pnl < 0;
      });

      const dailyLoss = Math.abs(todaysTrades.reduce((sum, p) => sum + p.pnl, 0));
      if (dailyLoss > config.riskManagement.maxDailyLossSol) {
        logger.warn('Daily loss limit exceeded', {
          dailyLoss,
          maxDailyLoss: config.riskManagement.maxDailyLossSol,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to check daily loss limit', error);
      return false;
    }
  }
}

export default new PositionManager();
