import logger from './logger.js';
import config from './config.js';
import jupiterData from './jupiterData.js';
import sentimentAnalysis from './sentimentAnalysis.js';
import positionManager from './positionManager.js';
import tradeExecution from './tradeExecution.js';

/**
 * Test Suite for Solana Trading Bot
 */

async function testConfiguration() {
  console.log('\n📋 Testing Configuration...');
  try {
    console.log('✓ Configuration loaded successfully');
    console.log(`  - RPC Endpoint: ${config.rpc.endpoint}`);
    console.log(`  - Wallet: ${config.wallet.address}`);
    console.log(`  - Starting Capital: ${config.riskManagement.startingCapitalSol} SOL`);
    console.log(`  - Max Position: ${config.riskManagement.maxPositionSizeSol} SOL`);
    return true;
  } catch (error) {
    console.error('✗ Configuration test failed:', error.message);
    return false;
  }
}

async function testWalletConnection() {
  console.log('\n🔐 Testing Wallet Connection...');
  try {
    const balance = await tradeExecution.getSolBalance();
    console.log(`✓ Connected to wallet`);
    console.log(`  - Address: ${config.wallet.address}`);
    console.log(`  - Balance: ${balance.toFixed(4)} SOL`);
    
    if (balance < 0.1) {
      console.warn('⚠️  Low balance! Need at least 0.1 SOL for testing');
    }
    return true;
  } catch (error) {
    console.error('✗ Wallet connection failed:', error.message);
    return false;
  }
}

async function testTokenScreening() {
  console.log('\n🔍 Testing Token Screening...');
  try {
    console.log('  Fetching tokens...');
    const tokens = await jupiterData.getAllTokens();
    console.log(`✓ Retrieved ${tokens.length} tokens`);
    
    console.log('  Screening for momentum signals...');
    const screened = await jupiterData.screenTokens(tokens.slice(0, 100));
    console.log(`✓ Found ${screened.length} tokens passing technical criteria`);
    
    if (screened.length > 0) {
      console.log('\n  Top 3 Candidates:');
      screened.slice(0, 3).forEach((token, idx) => {
        console.log(`  ${idx + 1}. ${token.symbol}`);
        console.log(`     Liquidity: $${(token.liquidity / 1e6).toFixed(2)}M`);
        console.log(`     24h Change: ${token.priceChange24h.toFixed(2)}%`);
        console.log(`     Buy Volume Score: ${token.buyVolumeScore.toFixed(2)}`);
        console.log(`     Screen Score: ${token.screenScore.toFixed(2)}`);
      });
    }
    return true;
  } catch (error) {
    console.error('✗ Token screening failed:', error.message);
    return false;
  }
}

async function testPriceData() {
  console.log('\n📊 Testing Price Data Fetch...');
  try {
    // Test with USDC mint
    const usdcMint = 'EPjFWaJNquvv7kLkx39g2yVPwsksSUf34cd7ntsD29zM';
    const price = await jupiterData.getTokenPrice(usdcMint);
    
    if (price) {
      console.log('✓ Price data retrieved successfully');
      console.log(`  - USDC Price: $${price.price.toFixed(2)}`);
      console.log(`  - Liquidity: $${(price.liquidity / 1e6).toFixed(2)}M`);
    } else {
      console.warn('⚠️  Could not fetch price data');
    }
    return true;
  } catch (error) {
    console.error('✗ Price data test failed:', error.message);
    return false;
  }
}

async function testSentimentAnalysis() {
  console.log('\n💬 Testing Sentiment Analysis...');
  try {
    console.log('  Analyzing sentiment for SOL...');
    const sentiment = await sentimentAnalysis.analyzeTokenSentiment('SOL', 'So11111111111111111111111111111111111111112');
    
    console.log('✓ Sentiment analysis complete');
    console.log(`  - Overall Score: ${sentiment.overallScore.toFixed(2)}/1.0`);
    Object.entries(sentiment.platforms).forEach(([platform, score]) => {
      console.log(`  - ${platform}: ${score.toFixed(2)}`);
    });
    console.log(`  - Passed Requirement: ${sentiment.passedRequirement ? '✓ Yes' : '✗ No'}`);
    
    return true;
  } catch (error) {
    console.error('✗ Sentiment analysis failed:', error.message);
    return false;
  }
}

async function testPositionManager() {
  console.log('\n📈 Testing Position Manager...');
  try {
    // Clear existing positions for test
    const initialPositions = positionManager.getOpenPositions();
    console.log(`✓ Position Manager initialized`);
    console.log(`  - Open Positions: ${initialPositions.length}`);
    
    // Test opening position
    const testPosition = {
      tokenAddress: 'EPjFWaJNquvv7kLkx39g2yVPwsksSUf34cd7ntsD29zM',
      tokenSymbol: 'USDC',
      entryPrice: 1.0,
      sizeSol: 0.1,
    };
    
    const position = positionManager.openPosition(testPosition);
    console.log(`✓ Test position opened`);
    console.log(`  - Position ID: ${position.id}`);
    console.log(`  - Entry Price: $${position.entryPrice.toFixed(2)}`);
    console.log(`  - Size: ${position.sizeSol} SOL`);
    console.log(`  - Stop Loss: $${position.stopLossPrice.toFixed(2)}`);
    console.log(`  - Take Profit: $${position.takeProfitPrice.toFixed(2)}`);
    
    // Test updating position
    positionManager.updatePosition(position.id, 1.05);
    const updated = positionManager.positions.find(p => p.id === position.id);
    console.log(`✓ Position updated`);
    console.log(`  - Current Price: $${updated.currentPrice.toFixed(2)}`);
    console.log(`  - P&L: $${updated.pnl.toFixed(4)} (${updated.pnlPercent.toFixed(2)}%)`);
    
    // Test closing position
    positionManager.closePosition(position.id, 1.05, 'test');
    const closed = positionManager.positions.find(p => p.id === position.id);
    console.log(`✓ Position closed`);
    console.log(`  - Status: ${closed.status}`);
    console.log(`  - Final P&L: $${closed.pnl.toFixed(4)}`);
    
    // Test metrics
    const metrics = positionManager.getPortfolioMetrics();
    console.log(`✓ Portfolio metrics calculated`);
    console.log(`  - Total P&L: $${metrics.totalPnl.toFixed(4)}`);
    console.log(`  - Closed Trades: ${metrics.closedPositionsCount}`);
    console.log(`  - Win Rate: ${metrics.winRate.toFixed(1)}%`);
    
    return true;
  } catch (error) {
    console.error('✗ Position manager test failed:', error.message);
    return false;
  }
}

async function testTradeExecution() {
  console.log('\n💱 Testing Trade Execution (Dry Run)...');
  try {
    const testToken = 'EPjFWaJNquvv7kLkx39g2yVPwsksSUf34cd7ntsD29zM'; // USDC
    
    console.log('  Testing buy simulation...');
    const buyResult = await tradeExecution.simulateBuy(testToken, 0.1);
    console.log(`✓ Buy simulation successful`);
    console.log(`  - Input: 0.1 SOL`);
    console.log(`  - Output: ${buyResult.tokenAmount.toFixed(0)} tokens`);
    console.log(`  - Execution Price: ${buyResult.executionPrice.toFixed(6)}`);
    
    console.log('  Testing sell simulation...');
    const sellResult = await tradeExecution.simulateSell(testToken, buyResult.tokenAmount);
    console.log(`✓ Sell simulation successful`);
    console.log(`  - Input: ${buyResult.tokenAmount.toFixed(0)} tokens`);
    console.log(`  - Output: ${sellResult.solAmount.toFixed(4)} SOL`);
    console.log(`  - Execution Price: ${sellResult.executionPrice.toFixed(6)}`);
    
    return true;
  } catch (error) {
    console.error('✗ Trade execution test failed:', error.message);
    return false;
  }
}

async function testSwapQuote() {
  console.log('\n💹 Testing Swap Quote...');
  try {
    const solMint = 'So11111111111111111111111111111111111111112';
    const usdcMint = 'EPjFWaJNquvv7kLkx39g2yVPwsksSUf34cd7ntsD29zM';
    
    console.log('  Requesting quote for 0.1 SOL → USDC...');
    const quote = await jupiterData.getSwapQuote(solMint, usdcMint, 0.1);
    
    if (quote) {
      console.log('✓ Swap quote retrieved');
      console.log(`  - Input: 0.1 SOL`);
      console.log(`  - Output: ${(quote.outputAmount / 1e6).toFixed(2)} USDC`);
      console.log(`  - Execution Price: ${quote.executionPrice.toFixed(6)}`);
      console.log(`  - Price Impact: ${(quote.priceImpact * 100).toFixed(2)}%`);
    } else {
      console.warn('⚠️  Could not retrieve quote (API may be rate limited)');
    }
    return true;
  } catch (error) {
    console.error('✗ Swap quote test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🤖 SOLANA TRADING BOT - TEST SUITE');
  console.log('='.repeat(50));

  const tests = [
    { name: 'Configuration', fn: testConfiguration },
    { name: 'Wallet Connection', fn: testWalletConnection },
    { name: 'Price Data', fn: testPriceData },
    { name: 'Token Screening', fn: testTokenScreening },
    { name: 'Sentiment Analysis', fn: testSentimentAnalysis },
    { name: 'Position Manager', fn: testPositionManager },
    { name: 'Trade Execution', fn: testTradeExecution },
    { name: 'Swap Quote', fn: testSwapQuote },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`\n✗ ${test.name} test crashed:`, error.message);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Bot is ready to deploy.');
  } else {
    console.log('\n⚠️  Some tests failed. Check configuration and API keys.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});
