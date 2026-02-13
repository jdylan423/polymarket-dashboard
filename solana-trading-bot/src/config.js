import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const config = {
  // Wallet Configuration
  wallet: {
    address: process.env.WALLET_ADDRESS || '7TCVKKobfYgubXJaQVNnAKjK6QRWVcuZWFxYYDQ2jUrF',
    privateKey: process.env.WALLET_PRIVATE_KEY,
  },

  // RPC Configuration
  rpc: {
    endpoint: process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
    websocket: process.env.RPC_WEBSOCKET || 'wss://api.mainnet-beta.solana.com',
  },

  // Risk Management
  riskManagement: {
    startingCapitalSol: parseFloat(process.env.STARTING_CAPITAL_SOL) || 2,
    maxPositionSizeSol: parseFloat(process.env.MAX_POSITION_SIZE_SOL) || 0.5,
    maxSimultaneousPositions: parseInt(process.env.MAX_SIMULTANEOUS_POSITIONS) || 4,
    stopLossPercent: parseInt(process.env.STOP_LOSS_PERCENT) || -20,
    takeProfitPercent: parseInt(process.env.TAKE_PROFIT_PERCENT) || 30,
    portfolioStopLossPercent: parseInt(process.env.PORTFOLIO_STOP_LOSS_PERCENT) || -30,
    maxDailyLossSol: parseFloat(process.env.MAX_DAILY_LOSS_SOL) || 0.6,
  },

  // Strategy Parameters
  strategy: {
    minLiquidityUsd: parseFloat(process.env.MIN_LIQUIDITY_USD) || 1000000,
    tokenMinAgeHours: parseInt(process.env.TOKEN_MIN_AGE_HOURS) || 24,
    scanIntervalSeconds: parseInt(process.env.SCAN_INTERVAL_SECONDS) || 30,
    buyVolumeWindowHours: parseInt(process.env.BUY_VOLUME_WINDOW_HOURS) || 4,
    resistanceBreakoutThreshold: parseFloat(process.env.RESISTANCE_BREAKOUT_THRESHOLD) || 2.5,
  },

  // Sentiment Analysis
  sentiment: {
    platforms: (process.env.SENTIMENT_PLATFORMS || 'twitter,discord,telegram').split(','),
    minimumSentimentScore: parseFloat(process.env.MINIMUM_SENTIMENT_SCORE) || 0.6,
    minimumVolumeTrendingScore: parseFloat(process.env.MINIMUM_VOLUME_TRENDING_SCORE) || 0.7,
  },

  // API Keys
  apiKeys: {
    twitterBearerToken: process.env.TWITTER_BEARER_TOKEN,
    discordWebhookAlerts: process.env.DISCORD_WEBHOOK_ALERTS,
  },

  // Execution Parameters
  execution: {
    dryRun: process.env.DRY_RUN === 'true',
    slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE) || 1.5,
    priorityFeeLamports: parseInt(process.env.PRIORITY_FEE_LAMPORTS) || 100000,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/trading.log',
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30,
  },

  // Advanced Settings
  advanced: {
    debugMode: process.env.DEBUG_MODE === 'true',
    enableSafeguards: process.env.ENABLE_SAFEGUARDS !== 'false',
  },
};

/**
 * Validate critical configuration
 */
export function validateConfig() {
  const errors = [];

  if (!config.wallet.privateKey && !config.execution.dryRun) {
    errors.push('WALLET_PRIVATE_KEY is required for live trading');
  }

  if (config.riskManagement.maxPositionSizeSol > config.riskManagement.startingCapitalSol) {
    errors.push('Max position size cannot exceed starting capital');
  }

  if (config.riskManagement.maxSimultaneousPositions < 1) {
    errors.push('Max simultaneous positions must be at least 1');
  }

  if (config.strategy.minLiquidityUsd < 100000) {
    errors.push('Minimum liquidity should be at least $100k');
  }

  if (errors.length > 0) {
    console.error('Configuration Validation Errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    return false;
  }

  return true;
}

export default config;
