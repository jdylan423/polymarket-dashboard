import axios from 'axios';
import logger from './logger.js';
import config from './config.js';

/**
 * Unified Alerting System
 * Sends alerts via Discord and/or Telegram
 */
class AlertingSystem {
  constructor() {
    this.alerts = [];
    this.maxQueueSize = 100;
    this.lastAlertTime = {};
    this.alertCooldown = 60000; // 1 minute between same alert type
  }

  /**
   * Check if alert should be sent (cooldown check)
   */
  shouldSendAlert(alertType) {
    const now = Date.now();
    const lastTime = this.lastAlertTime[alertType] || 0;
    
    if (now - lastTime >= this.alertCooldown) {
      this.lastAlertTime[alertType] = now;
      return true;
    }
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
          'Size': `${position.sizeSol} SOL`,
          'Stop Loss': `$${position.stopLossPrice.toFixed(6)}`,
          'Take Profit': `$${position.takeProfitPrice.toFixed(6)}`,
          'Position ID': position.id,
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
      const message = {
        title: '📊 Position Closed',
        description: `${position.tokenSymbol} - ${position.exitReason.toUpperCase()}`,
        fields: {
          'Entry Price': `$${position.entryPrice.toFixed(6)}`,
          'Exit Price': `$${position.exitPrice.toFixed(6)}`,
          'P&L': `$${position.pnl.toFixed(4)}`,
          'P&L %': `${position.pnlPercent.toFixed(2)}%`,
          'Duration': `${(position.duration / 1000 / 60).toFixed(2)} min`,
        },
        color,
      };

      await this.sendAlert(message, 'position_closed');
      logger.info('Position closed alert sent', { token: position.tokenSymbol });
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

      const message = {
        title: '📈 Portfolio Update',
        description: 'Current performance snapshot',
        fields: {
          'Total P&L': `$${metrics.totalPnl.toFixed(4)}`,
          'Return %': `${metrics.totalPnlPercent.toFixed(2)}%`,
          'Open Positions': metrics.openPositionsCount.toString(),
          'Win Rate': `${metrics.winRate.toFixed(1)}%`,
          'Trades': `${metrics.closedPositionsCount} closed`,
        },
        color: 0x0099ff, // Blue
      };

      await this.sendAlert(message, 'portfolio_metrics');
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
        description: safeguardType.toUpperCase(),
        fields: {
          ...details,
          'Timestamp': new Date().toISOString(),
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
  async alertError(errorMessage, context = {}) {
    try {
      if (!this.shouldSendAlert('error')) return;

      const message = {
        title: '⚠️ Bot Error',
        description: errorMessage,
        fields: {
          ...context,
          'Timestamp': new Date().toISOString(),
        },
        color: 0xff0000, // Red
      };

      await this.sendAlert(message, 'error');
      logger.warn('Error alert sent', { error: errorMessage });
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

      const message = {
        title: '📅 Daily Summary',
        description: new Date().toLocaleDateString(),
        fields: {
          'Trades': summary.trades?.toString() || '0',
          'Wins': summary.wins?.toString() || '0',
          'Losses': summary.losses?.toString() || '0',
          'Daily P&L': `$${summary.dailyPnl?.toFixed(4) || '0.00'}`,
          'Win Rate': `${summary.winRate?.toFixed(1) || '0'}%`,
        },
        color: 0x9900ff, // Purple
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
    if (config.apiKeys.discordWebhookAlerts) {
      promises.push(this.sendDiscordAlert(message, alertType));
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
        },
      };

      await axios.post(config.apiKeys.discordWebhookAlerts, {
        embeds: [embed],
      }, {
        timeout: 5000,
      });

      logger.debug(`Discord alert sent: ${alertType}`);
    } catch (error) {
      logger.warn('Failed to send Discord alert', error);
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

      await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: 'HTML',
        },
        { timeout: 5000 }
      );

      logger.debug(`Telegram alert sent: ${alertType}`);
    } catch (error) {
      logger.warn('Failed to send Telegram alert', error);
    }
  }

  /**
   * Format message for Telegram
   */
  formatTelegramMessage(message) {
    let text = `<b>${message.title}</b>\n`;
    
    if (message.description) {
      text += `${message.description}\n\n`;
    }

    if (message.fields) {
      Object.entries(message.fields).forEach(([key, value]) => {
        text += `<b>${key}:</b> ${value}\n`;
      });
    }

    return text;
  }

  /**
   * Queue alert for sending
   */
  queueAlert(alertData) {
    try {
      if (this.alerts.length >= this.maxQueueSize) {
        this.alerts.shift(); // Remove oldest
      }
      
      this.alerts.push({
        ...alertData,
        queuedAt: Date.now(),
      });
    } catch (error) {
      logger.error('Failed to queue alert', error);
    }
  }

  /**
   * Get pending alerts
   */
  getPendingAlerts() {
    return this.alerts.filter(a => !a.sent);
  }

  /**
   * Clear sent alerts
   */
  clearSentAlerts() {
    this.alerts = this.alerts.filter(a => !a.sent);
  }
}

export default new AlertingSystem();
