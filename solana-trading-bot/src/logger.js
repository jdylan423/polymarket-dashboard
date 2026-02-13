import winston from 'winston';
import path from 'path';
import config from './config.js';

// Custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    trace: 5,
    trade: 2,
    sentiment: 3,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    debug: 'blue',
    trace: 'magenta',
    trade: 'cyan',
    sentiment: 'yellow',
  },
};

// Configure Winston
const logger = winston.createLogger({
  levels: customLevels.levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'solana-trading-bot' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Trade logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'trades.log'),
      level: 'trade',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Sentiment logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'sentiment.log'),
      level: 'sentiment',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'trading.log'),
      level: config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      ),
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ colors: customLevels.colors }),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length && meta.service !== 'solana-trading-bot'
            ? ` ${JSON.stringify(meta)}`
            : '';
          return `${timestamp} [${level}] ${message}${metaStr}`;
        })
      ),
    })
  );
}

winston.addColors(customLevels.colors);

/**
 * Trade-specific logging
 */
export const logTrade = (tradeData) => {
  logger.log('trade', 'Trade Executed', {
    ...tradeData,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Sentiment analysis logging
 */
export const logSentiment = (tokenAddress, sentimentData) => {
  logger.log('sentiment', `Sentiment Analysis for ${tokenAddress}`, {
    tokenAddress,
    ...sentimentData,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error logging with context
 */
export const logError = (message, error, context = {}) => {
  logger.error(message, {
    error: error.message,
    stack: error.stack,
    ...context,
  });
};

/**
 * Performance metrics logging
 */
export const logMetrics = (metrics) => {
  logger.info('Performance Metrics', metrics);
};

export default logger;
