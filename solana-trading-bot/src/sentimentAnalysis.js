import axios from 'axios';
import logger from './logger.js';
import config from './config.js';

/**
 * Analyze sentiment across multiple platforms for a token
 */
export async function analyzeTokenSentiment(tokenSymbol, tokenAddress) {
  try {
    const results = {
      symbol: tokenSymbol,
      address: tokenAddress,
      platforms: {},
      overallScore: 0,
      timestamp: Date.now(),
    };

    // Collect sentiment from configured platforms
    const platformPromises = [];

    if (config.sentiment.platforms.includes('twitter')) {
      platformPromises.push(
        analyzeTwitterSentiment(tokenSymbol)
          .then(score => {
            results.platforms.twitter = score;
          })
          .catch(err => {
            logger.warn(`Twitter sentiment failed for ${tokenSymbol}`, err);
            results.platforms.twitter = 0.5; // Neutral default
          })
      );
    }

    if (config.sentiment.platforms.includes('discord')) {
      platformPromises.push(
        analyzeDiscordSentiment(tokenSymbol)
          .then(score => {
            results.platforms.discord = score;
          })
          .catch(err => {
            logger.warn(`Discord sentiment failed for ${tokenSymbol}`, err);
            results.platforms.discord = 0.5;
          })
      );
    }

    if (config.sentiment.platforms.includes('telegram')) {
      platformPromises.push(
        analyzeTelegramSentiment(tokenSymbol)
          .then(score => {
            results.platforms.telegram = score;
          })
          .catch(err => {
            logger.warn(`Telegram sentiment failed for ${tokenSymbol}`, err);
            results.platforms.telegram = 0.5;
          })
      );
    }

    await Promise.all(platformPromises);

    // Calculate overall score (average of platforms)
    const scores = Object.values(results.platforms).filter(s => typeof s === 'number');
    results.overallScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0.5;

    results.passedRequirement = results.overallScore >= config.sentiment.minimumSentimentScore;

    logger.log('sentiment', `Sentiment Analysis: ${tokenSymbol}`, results);
    return results;
  } catch (error) {
    logger.error(`Sentiment analysis failed for ${tokenSymbol}`, error);
    return {
      symbol: tokenSymbol,
      address: tokenAddress,
      overallScore: 0,
      passedRequirement: false,
      error: error.message,
    };
  }
}

/**
 * Analyze Twitter/X sentiment
 */
async function analyzeTwitterSentiment(tokenSymbol) {
  try {
    if (!config.apiKeys.twitterBearerToken) {
      logger.warn('Twitter Bearer Token not configured');
      return 0.5;
    }

    const query = `${tokenSymbol} (bull OR bullish OR pump OR moon OR moon OR lambo) -is:retweet`;
    
    const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      params: {
        query,
        max_results: 10,
        'tweet.fields': 'public_metrics,created_at',
      },
      headers: {
        Authorization: `Bearer ${config.apiKeys.twitterBearerToken}`,
      },
      timeout: 5000,
    });

    if (!response.data.data || response.data.data.length === 0) {
      return 0.5;
    }

    // Calculate sentiment based on engagement
    let totalScore = 0;
    let count = 0;

    response.data.data.forEach(tweet => {
      const metrics = tweet.public_metrics || {};
      const engagement = metrics.like_count + metrics.retweet_count + metrics.reply_count;
      const sentiment = engagement > 100 ? 0.8 : engagement > 10 ? 0.6 : 0.4;
      totalScore += sentiment;
      count++;
    });

    return count > 0 ? Math.min(totalScore / count, 1.0) : 0.5;
  } catch (error) {
    logger.debug(`Twitter sentiment analysis failed: ${error.message}`);
    return 0.5;
  }
}

/**
 * Analyze Discord sentiment
 */
async function analyzeDiscordSentiment(tokenSymbol) {
  try {
    // This would require Discord bot integration and server membership
    // For production, implement Discord bot with sentiment keywords
    
    // Simulated sentiment scoring based on token activity
    const sentimentKeywords = {
      bullish: ['bull', 'bullish', 'moon', 'pump', 'lambo', 'diamond', 'hodl'],
      bearish: ['dump', 'rug', 'bearish', 'crash', 'selling', 'exit'],
    };

    // In production: fetch Discord messages from configured servers
    // For now, return placeholder
    logger.debug(`Discord sentiment requires bot integration for ${tokenSymbol}`);
    return 0.6; // Default neutral-positive
  } catch (error) {
    logger.debug(`Discord sentiment analysis failed: ${error.message}`);
    return 0.5;
  }
}

/**
 * Analyze Telegram sentiment
 */
async function analyzeTelegramSentiment(tokenSymbol) {
  try {
    // This would require Telegram bot integration
    // For production, implement Telegram bot with message monitoring
    
    logger.debug(`Telegram sentiment requires bot integration for ${tokenSymbol}`);
    return 0.6; // Default neutral-positive
  } catch (error) {
    logger.debug(`Telegram sentiment analysis failed: ${error.message}`);
    return 0.5;
  }
}

/**
 * Check if token is trending on social media
 */
export async function checkVolumeTrendingScore(tokenSymbol) {
  try {
    let trendingScore = 0;
    let platformCount = 0;

    // Check Twitter trending
    if (config.sentiment.platforms.includes('twitter')) {
      const twitterScore = await checkTwitterTrending(tokenSymbol);
      trendingScore += twitterScore;
      platformCount++;
    }

    // Check Discord activity
    if (config.sentiment.platforms.includes('discord')) {
      const discordScore = await checkDiscordTrending(tokenSymbol);
      trendingScore += discordScore;
      platformCount++;
    }

    // Check Telegram activity
    if (config.sentiment.platforms.includes('telegram')) {
      const telegramScore = await checkTelegramTrending(tokenSymbol);
      trendingScore += telegramScore;
      platformCount++;
    }

    return platformCount > 0 ? trendingScore / platformCount : 0;
  } catch (error) {
    logger.debug(`Trending score check failed for ${tokenSymbol}`, error);
    return 0;
  }
}

async function checkTwitterTrending(tokenSymbol) {
  try {
    if (!config.apiKeys.twitterBearerToken) return 0;

    const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      params: {
        query: tokenSymbol,
        max_results: 100,
        'tweet.fields': 'created_at',
      },
      headers: {
        Authorization: `Bearer ${config.apiKeys.twitterBearerToken}`,
      },
      timeout: 5000,
    });

    const count = response.data.meta?.result_count || 0;
    return Math.min(count / 100, 1.0); // Normalize to 0-1
  } catch (error) {
    return 0;
  }
}

async function checkDiscordTrending(tokenSymbol) {
  // Would require Discord bot integration
  return Math.random() * 0.5; // Placeholder
}

async function checkTelegramTrending(tokenSymbol) {
  // Would require Telegram bot integration
  return Math.random() * 0.5; // Placeholder
}

/**
 * Combined sentiment check for trading decision
 */
export async function checkSentimentGates(tokenSymbol, tokenAddress) {
  try {
    const sentiment = await analyzeTokenSentiment(tokenSymbol, tokenAddress);
    const trendingScore = await checkVolumeTrendingScore(tokenSymbol);

    return {
      sentimentPassed: sentiment.passedRequirement,
      sentimentScore: sentiment.overallScore,
      trendingScore,
      volumeTrendingPassed: trendingScore >= config.sentiment.minimumVolumeTrendingScore,
      allGatesPassed: 
        sentiment.passedRequirement && 
        trendingScore >= config.sentiment.minimumVolumeTrendingScore,
    };
  } catch (error) {
    logger.error(`Sentiment gate check failed for ${tokenSymbol}`, error);
    return {
      sentimentPassed: false,
      sentimentScore: 0,
      trendingScore: 0,
      volumeTrendingPassed: false,
      allGatesPassed: false,
      error: error.message,
    };
  }
}

export default {
  analyzeTokenSentiment,
  checkVolumeTrendingScore,
  checkSentimentGates,
};
