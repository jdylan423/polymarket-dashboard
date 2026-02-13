import axios from 'axios';
import logger from './logger.js';
import config from './config.js';

/**
 * Enhanced Alert System
 * Multi-channel notifications with rate limiting and persistence
 * Supports: Discord webhooks, Telegram bots
 */
class AlertSystem {
  constructor() {
    this.alertQueue = [];
    this.maxQueueSize = 100;
    this.rateLimits = new Map(); // alertType -> lastSendTime
    this.defaultCooldowns = {
      position_opened: 5000, // 5 seconds
      position_closed: 5000,
      portfolio_metrics: 60000, // 1 minute
      safeguard_trigger: 30000, // 30 seconds
      error: 30000,
      daily_summary: 300000, // 5 minutes
    };
  }

  /**
   * Check if alert should be sent (rate limit check)
   */
  shouldSendAlert(alertType) {
    const now = Date.now();
    const lastTime = this.rateLimits.get(alertType) || 0;
    const cooldown = this.defaultCooldowns[alertType] || 60000;

    if (now - lastTime >= cooldown) {
      this.rateLimits.set(alertType, now);
      return true;
    }

    logger.debug(`Alert rate limited: ${alertType} (cooldown: ${cooldown}ms)`);
    return false;
  }

  /**
   * Send position opened alert
   */
  async alertPositionOpened(position) {
    try {
      if (!this.shouldSendAlert('position_opened')) return;

      const message = {
        title: '🎯 New Position Opened',
        description: `Token: ${position.tokenSymbol}`,
        fields: {
          'Entry Price': `$${position.entryPrice.toFixed(6)}`,
          'Position Size': `${position.sizeSol.toFixed(4)} SOL`,
          'Stop Loss': `$${position.stopLossPrice?.toFixed(6) || 'N/A'}`,
          'Take Profit': `$${position.takeProfitPrice?.toFixed(6) || 'N/A'}`,
          'Position ID': position.id,
          'Timestamp': new Date().toISOString(),
        },
        color: 0x00ff00, // Green
      };

      await this.sendAlert(message, 'position_opened');
      logger.info('Position opened alert sent', { token: position.tokenSymbol });
    } catch (error) {
      logger.error('Failed to send position opened alert', error);
    }
  }

  /**
   * Send position closed alert
   */
  async alertPositionClosed(position) {
    try {
      if (!this.shouldSendAlert('position_closed')) return;

      const color = position.pnl > 0 ? 0x00ff00 : 0xff0000; // Green if profit, red if loss
      const emoji = position.pnl > 0 ? '✅' : '❌';

      const message = {
        title: `${emoji} Position Closed`,
        description: `${position.tokenSymbol} - ${(position.exitReason || 'closed').toUpperCase()}`,
        fields: {
          'Entry Price': `$${position.entryPrice.toFixed(6)}`,
          'Exit Price': `$${position.exitPrice.toFixed(6)}`,
          'P&L': `$${position.pnl.toFixed(4)}`,
          'P&L %': `${position.pnlPercent.toFixed(2)}%`,
          'Duration': `${(position.duration / 1000 / 60).toFixed(2)} min`,
          'Exit Reason': position.exitReason || 'unknown',
        },
        color,
      };

      await this.sendAlert(message, 'position_closed');
      logger.info('Position closed alert sent', { token: position.tokenSymbol, pnl: position.pnl.toFixed(4) });
    } catch (error) {
      logger.error('Failed to send position closed alert', error);
    }
  }

  /**
   * Send portfolio metrics alert
   */
  async alertPortfolioMetrics(metrics) {
    try {
      if (!this.shouldSendAlert('portfolio_metrics')) return;

      const color = metrics.totalPnl >= 0 ? 0x00ff00 : 0xff0000;

      const message = {
        title: '📈 Portfolio Update',
        description: `Session Performance Snapshot`,
        fields: {
          'Total P&L': `$${metrics.totalPnl.toFixed(4)}`,
          'Return %': `${metrics.totalPnlPercent.toFixed(2)}%`,
          'Open Positions': metrics.openPositionsCount?.toString() || '0',
          'Closed Positions': metrics.closedPositionsCount?.toString() || '0',
          'Win Rate': `${metrics.winRate?.toFixed(1) || '0'}%`,
          'Avg Win': `$${metrics.avgWin?.toFixed(4) || '0.00'}`,
          'Avg Loss': `$${Math.abs(metrics.avgLoss || 0).toFixed(4)}`,
          'Best Trade': `$${metrics.bestTrade?.toFixed(4) || '0.00'}`,
          'Worst Trade': `$${(metrics.worstTrade || 0).toFixed(4)}`,
        },
        color,
      };

      await this.sendAlert(message, 'portfolio_metrics');
      logger.info('Portfolio metrics alert sent');
    } catch (error) {
      logger.error('Failed to send portfolio metrics alert', error);
    }
  }

  /**
   * Send safeguard trigger alert
   */
  async alertSafeguardTriggered(safeguardType, details) {
    try {
      if (!this.shouldSendAlert('safeguard_trigger')) return;

      const message = {
        title: '🚨 Safeguard Triggered!',
        description: safeguardType.toUpperCase().replace(/_/g, ' '),
        fields: {
          ...details,
          'Timestamp': new Date().toISOString(),
          'Action': 'Trading halted pending review',
        },
        color: 0xff6600, // Orange
      };

      await this.sendAlert(message, 'safeguard_trigger');
      logger.warn('Safeguard trigger alert sent', { safeguardType });
    } catch (error) {
      logger.error('Failed to send safeguard trigger alert', error);
    }
  }

  /**
   * Send error alert
   */
  async alertError(title, context = {}) {
    try {
      if (!this.shouldSendAlert('error')) return;

      const message = {
        title: `⚠️ ${title}`,
        description: 'Check logs for details',
        fields: {
          ...context,
          'Timestamp': new Date().toISOString(),
        },
        color: 0xff3333, // Red
      };

      await this.sendAlert(message, 'error');
      logger.warn('Error alert sent', { title });
    } catch (error) {
      logger.error('Failed to send error alert', error);
    }
  }

  /**
   * Send daily summary alert
   */
  async alertDailySummary(summary) {
    try {
      if (!this.shouldSendAlert('daily_summary')) return;

      const winRate = summary.trades > 0 ? (summary.wins / summary.trades) * 100 : 0;
      const color = summary.dailyPnl >= 0 ? 0x00ff00 : 0xff0000;

      const message = {
        title: '📅 Daily Summary',
        description: new Date().toLocaleDateString(),
        fields: {
          'Total Trades': summary.trades?.toString() || '0',
          'Wins': summary.wins?.toString() || '0',
          'Losses': summary.losses?.toString() || '0',
          'Win Rate': `${winRate.toFixed(1)}%`,
          'Daily P&L': `$${summary.dailyPnl?.toFixed(4) || '0.00'}`,
          'Best Trade': `$${summary.bestTrade?.toFixed(4) || '0.00'}`,
          'Worst Trade': `$${summary.worstTrade?.toFixed(4) || '0.00'}`,
        },
        color,
      };

      await this.sendAlert(message, 'daily_summary');
      logger.info('Daily summary alert sent');
    } catch (error) {
      logger.error('Failed to send daily summary alert', error);
    }
  }

  /**
   * Send alert via Discord and/or Telegram
   */
  async sendAlert(message, alertType) {
    const promises = [];

    // Send to Discord
    if (config.apiKeys?.discordWebhookAlerts) {
      promises.push(this.sendDiscordAlert(message, alertType));
    } else {
      logger.debug('Discord webhook not configured');
    }

    // Send to Telegram (requires bot token and chat ID)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      promises.push(this.sendTelegramAlert(message, alertType));
    }

    if (promises.length === 0) {
      logger.debug('No alert channels configured');
      return;
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send Discord webhook alert
   */
  async sendDiscordAlert(message, alertType) {
    try {
      const embed = {
        title: message.title,
        description: message.description || '',
        color: message.color || 0x0099ff,
        fields: Object.entries(message.fields || {}).map(([name, value]) => ({
          name,
          value: String(value),
          inline: true,
        })),
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Solana Trading Bot',
          icon_url: 'https://www.arweave.net/tFgKjJ_j5YdIyE3TUVlJHSqGW2JvCJNBL8BDXmvXhAE?ext=png',
        },
      };

      const payload = {
        embeds: [embed],
        username: 'Solana Trading Bot',
        avatar_url: 'https://www.arweave.net/tFgKjJ_j5YdIyE3TUVlJHSqGW2JvCJNBL8BDXmvXhAE?ext=png',
      };

      const response = await axios.post(config.apiKeys.discordWebhookAlerts, payload, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 204 || response.status === 200) {
        logger.debug(`Discord alert sent successfully: ${alertType}`);
      } else {
        logger.warn(`Discord alert returned status: ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 429) {
        logger.warn('Discord rate limited');
      } else {
        logger.warn(`Failed to send Discord alert: ${error.message}`);
      }
    }
  }

  /**
   * Send Telegram alert
   */
  async sendTelegramAlert(message, alertType) {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        return;
      }

      const telegramMessage = this.formatTelegramMessage(message);

      const response = await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        },
        { timeout: 5000 }
      );

      if (response.data.ok) {
        logger.debug(`Telegram alert sent successfully: ${alertType}`);
      } else {
        logger.warn(`Telegram alert failed: ${response.data.description}`);
      }
    } catch (error) {
      if (error.response?.status === 429) {
        logger.warn('Telegram rate limited');
      } else {
        logger.warn(`Failed to send Telegram alert: ${error.message}`);
      }
    }
  }

  /**
   * Format message for Telegram
   */
  formatTelegramMessage(message) {
    let text = `<b>${message.title}</b>\n`;

    if (message.description) {
      text += `<i>${message.description}</i>\n\n`;
    }

    if (message.fields) {
      Object.entries(message.fields).forEach(([key, value]) => {
        text += `<b>${key}:</b> <code>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>\n`;
      });
    }

    return text;
  }

  /**
   * Queue alert for batch sending
   */
  queueAlert(alertData) {
    try {
      if (this.alertQueue.length >= this.maxQueueSize) {
        this.alertQueue.shift(); // Remove oldest
      }

      this.alertQueue.push({
        ...alertData,
        queuedAt: Date.now(),
      });

      logger.debug(`Alert queued. Queue size: ${this.alertQueue.length}`);
    } catch (error) {
      logger.error('Failed to queue alert', error);
    }
  }

  /**
   * Get pending alerts
   */
  getPendingAlerts() {
    return this.alertQueue.filter(a => !a.sent);
  }

  /**
   * Process alert queue
   */
  async processQueue() {
    try {
      const pending = this.getPendingAlerts();

      for (const alert of pending) {
        try {
          await this.sendAlert(alert.message, alert.type);
          alert.sent = true;
          alert.sentAt = Date.now();
        } catch (error) {
          logger.warn(`Failed to send queued alert`, error);
        }
      }

      // Clean up sent alerts
      this.alertQueue = this.alertQueue.filter(a => !a.sent || Date.now() - a.queuedAt < 3600000); // Keep 1 hour

      logger.debug(`Alert queue processed. Remaining: ${this.getPendingAlerts().length}`);
    } catch (error) {
      logger.error('Failed to process alert queue', error);
    }
  }

  /**
   * Clear alert queue
   */
  clearQueue() {
    this.alertQueue = [];
    logger.info('Alert queue cleared');
  }

  /**
   * Get alert stats
   */
  getStats() {
    return {
      queueSize: this.alertQueue.length,
      pending: this.getPendingAlerts().length,
      sent: this.alertQueue.filter(a => a.sent).length,
      rateLimits: Object.fromEntries(this.rateLimits),
    };
  }
}

export default new AlertSystem();
