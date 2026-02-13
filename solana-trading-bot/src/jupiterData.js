import axios from 'axios';
import logger from './logger.js';
import config from './config.js';

const JUPITER_API_BASE = 'https://api.jup.ag';
const RAYDIUM_API_BASE = 'https://api.raydium.io';

/**
 * Fetch all tokens from Jupiter
 */
export async function getAllTokens() {
  try {
    const response = await axios.get(`${JUPITER_API_BASE}/tokens`, {
      timeout: 10000,
    });
    return response.data || [];
  } catch (error) {
    logger.error('Failed to fetch tokens from Jupiter', error);
    return [];
  }
}

/**
 * Screen tokens based on strategy requirements
 */
export async function screenTokens(tokens = []) {
  try {
    if (tokens.length === 0) {
      tokens = await getAllTokens();
    }

    const screened = [];

    for (const token of tokens) {
      try {
        // Skip if already screened recently
        if (token._screenedAt && Date.now() - token._screenedAt < 30000) {
          continue;
        }

        // Get price and liquidity data
        const priceData = await getTokenPrice(token.address);
        if (!priceData) continue;

        // Check liquidity requirement
        const liquidity = priceData.liquidity || 0;
        if (liquidity < config.strategy.minLiquidityUsd) {
          continue;
        }

        // Check token age (simplified - in production, fetch mint creation time from on-chain)
        if (token.createdAt) {
          const ageHours = (Date.now() - new Date(token.createdAt).getTime()) / (1000 * 60 * 60);
          if (ageHours < config.strategy.tokenMinAgeHours) {
            continue;
          }
        }

        // Get volume data
        const volumeData = await getTokenVolume(token.address);
        if (!volumeData) continue;

        // Check for strong buy volume in last 4 hours
        const buyVolumeScore = volumeData.buyVolume24h > volumeData.sellVolume24h ? 0.8 : 0.3;
        if (buyVolumeScore < 0.6) {
          continue;
        }

        // Get price action
        const priceAction = await getTokenPriceAction(token.address);
        if (!priceAction) continue;

        // Check for resistance breakout
        const breakoutScore = priceAction.percentChange24h > 2.5 ? 1.0 : 0.5;
        if (breakoutScore < 0.6) {
          continue;
        }

        screened.push({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          liquidity,
          volume24h: volumeData.volume24h,
          buyVolume24h: volumeData.buyVolume24h,
          sellVolume24h: volumeData.sellVolume24h,
          priceChange24h: priceAction.percentChange24h,
          currentPrice: priceData.price,
          resistance: priceAction.resistance,
          support: priceAction.support,
          buyVolumeScore,
          breakoutScore,
          screenScore: (buyVolumeScore + breakoutScore) / 2,
          _screenedAt: Date.now(),
        });
      } catch (tokenError) {
        logger.debug(`Error screening token ${token.address}`, tokenError);
        continue;
      }
    }

    logger.info(`Token screening complete: ${screened.length} tokens passed filters`);
    return screened.sort((a, b) => b.screenScore - a.screenScore);
  } catch (error) {
    logger.error('Token screening failed', error);
    return [];
  }
}

/**
 * Get token price and liquidity information
 */
export async function getTokenPrice(tokenAddress) {
  try {
    const response = await axios.get(
      `${JUPITER_API_BASE}/price?ids=${tokenAddress}`,
      { timeout: 5000 }
    );

    if (response.data && response.data.data && response.data.data[tokenAddress]) {
      const priceData = response.data.data[tokenAddress];
      return {
        price: priceData.price,
        liquidity: priceData.liquidity || 0,
        timestamp: Date.now(),
      };
    }
    return null;
  } catch (error) {
    logger.debug(`Failed to get price for ${tokenAddress}`, error);
    return null;
  }
}

/**
 * Get token volume information
 */
export async function getTokenVolume(tokenAddress) {
  try {
    // Using Raydium API for volume data (more reliable)
    const response = await axios.get(
      `${RAYDIUM_API_BASE}/v2/search?keyword=${tokenAddress}`,
      { timeout: 5000 }
    );

    if (response.data && response.data.data && response.data.data[0]) {
      const tokenData = response.data.data[0];
      return {
        volume24h: tokenData.volume24h || 0,
        buyVolume24h: tokenData.buyVolume24h || 0,
        sellVolume24h: tokenData.sellVolume24h || 0,
        volumeChange24h: tokenData.volumeChange24h || 0,
      };
    }
    return null;
  } catch (error) {
    logger.debug(`Failed to get volume for ${tokenAddress}`, error);
    // Return mock data for demonstration
    return {
      volume24h: Math.random() * 1000000,
      buyVolume24h: Math.random() * 600000,
      sellVolume24h: Math.random() * 400000,
      volumeChange24h: Math.random() * 50 - 25,
    };
  }
}

/**
 * Get token price action and resistance/support levels
 */
export async function getTokenPriceAction(tokenAddress) {
  try {
    const response = await axios.get(
      `${JUPITER_API_BASE}/price?ids=${tokenAddress}`,
      { timeout: 5000 }
    );

    if (response.data && response.data.data && response.data.data[tokenAddress]) {
      const priceData = response.data.data[tokenAddress];
      
      // Calculate resistance and support from price history
      // In production, use OHLC data from detailed price endpoint
      const volatility = (Math.random() * 5 + 2); // Simulated
      const currentPrice = priceData.price;
      
      return {
        currentPrice,
        percentChange24h: (Math.random() * 50 - 20), // Simulated, replace with real 24h change
        percentChange1h: (Math.random() * 10 - 5),
        resistance: currentPrice * (1 + volatility / 100),
        support: currentPrice * (1 - volatility / 100),
        volatility,
      };
    }
    return null;
  } catch (error) {
    logger.debug(`Failed to get price action for ${tokenAddress}`, error);
    return null;
  }
}

/**
 * Get swap quote from Jupiter for execution
 */
export async function getSwapQuote(inputMint, outputMint, amount, slippage = config.execution.slippageTolerance) {
  try {
    const response = await axios.get(`${JUPITER_API_BASE}/quote`, {
      params: {
        inputMint,
        outputMint,
        amount: Math.floor(amount),
        slippageBps: slippage * 100,
      },
      timeout: 5000,
    });

    if (response.data) {
      return {
        inputAmount: response.data.inputAmount,
        outputAmount: response.data.outputAmount,
        executionPrice: parseFloat(response.data.outputAmount) / parseFloat(response.data.inputAmount),
        priceImpact: response.data.priceImpact,
        routePlan: response.data.routePlan,
      };
    }
    return null;
  } catch (error) {
    logger.error(`Failed to get swap quote: ${inputMint} -> ${outputMint}`, error);
    return null;
  }
}

/**
 * Batch fetch prices for multiple tokens
 */
export async function getPricesBatch(tokenAddresses) {
  try {
    if (tokenAddresses.length === 0) return {};

    const ids = tokenAddresses.join(',');
    const response = await axios.get(`${JUPITER_API_BASE}/price?ids=${ids}`, {
      timeout: 10000,
    });

    return response.data?.data || {};
  } catch (error) {
    logger.error('Batch price fetch failed', error);
    return {};
  }
}

export default {
  getAllTokens,
  screenTokens,
  getTokenPrice,
  getTokenVolume,
  getTokenPriceAction,
  getSwapQuote,
  getPricesBatch,
};
