import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import axios from 'axios';
import logger from './logger.js';
import config from './config.js';

const JUPITER_API = 'https://api.jup.ag';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

class TradeExecutor {
  constructor() {
    this.connection = new Connection(config.rpc.endpoint, 'confirmed');
    this.wallet = null;
    this.initializeWallet();
  }

  /**
   * Initialize wallet from private key
   */
  initializeWallet() {
    try {
      if (!config.wallet.privateKey && !config.execution.dryRun) {
        throw new Error('Private key required for live trading');
      }

      if (config.wallet.privateKey) {
        const secretKey = Uint8Array.from(JSON.parse(config.wallet.privateKey));
        this.wallet = Keypair.fromSecretKey(secretKey);
        logger.info(`Wallet initialized: ${this.wallet.publicKey.toString()}`);
      }
    } catch (error) {
      logger.error('Failed to initialize wallet', error);
      if (!config.execution.dryRun) {
        throw error;
      }
    }
  }

  /**
   * Execute a buy trade
   */
  async executeBuy(tokenMint, solAmount) {
    try {
      if (config.execution.dryRun) {
        return this.simulateBuy(tokenMint, solAmount);
      }

      logger.info(`Executing buy: ${solAmount} SOL for token ${tokenMint}`);

      // Get swap quote
      const quote = await this.getSwapQuote(SOL_MINT, tokenMint, solAmount);
      if (!quote) {
        throw new Error('Failed to get swap quote');
      }

      // Get swap instructions
      const swapInstructions = await this.getSwapInstructions(
        SOL_MINT,
        tokenMint,
        solAmount,
        quote.outputAmount,
        config.execution.slippageTolerance
      );

      if (!swapInstructions) {
        throw new Error('Failed to get swap instructions');
      }

      // Build and sign transaction
      const transaction = await this.buildAndSignTransaction(swapInstructions);
      if (!transaction) {
        throw new Error('Failed to build/sign transaction');
      }

      // Execute transaction
      const signature = await this.sendTransaction(transaction);
      
      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      if (!confirmation.value.err) {
        logger.log('trade', 'Buy Trade Executed', {
          tokenMint,
          solAmount,
          tokenAmount: quote.outputAmount,
          executionPrice: parseFloat(solAmount) / parseFloat(quote.outputAmount),
          signature,
          priceImpact: quote.priceImpact,
        });

        return {
          success: true,
          signature,
          tokenAmount: quote.outputAmount,
          executionPrice: parseFloat(solAmount) / parseFloat(quote.outputAmount),
        };
      } else {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
    } catch (error) {
      logger.error('Buy trade execution failed', error, { tokenMint, solAmount });
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a sell trade
   */
  async executeSell(tokenMint, tokenAmount) {
    try {
      if (config.execution.dryRun) {
        return this.simulateSell(tokenMint, tokenAmount);
      }

      logger.info(`Executing sell: ${tokenAmount} tokens of ${tokenMint}`);

      // Get swap quote
      const quote = await this.getSwapQuote(tokenMint, SOL_MINT, tokenAmount);
      if (!quote) {
        throw new Error('Failed to get swap quote');
      }

      // Get swap instructions
      const swapInstructions = await this.getSwapInstructions(
        tokenMint,
        SOL_MINT,
        tokenAmount,
        quote.outputAmount,
        config.execution.slippageTolerance
      );

      if (!swapInstructions) {
        throw new Error('Failed to get swap instructions');
      }

      // Build and sign transaction
      const transaction = await this.buildAndSignTransaction(swapInstructions);
      if (!transaction) {
        throw new Error('Failed to build/sign transaction');
      }

      // Execute transaction
      const signature = await this.sendTransaction(transaction);
      
      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      if (!confirmation.value.err) {
        logger.log('trade', 'Sell Trade Executed', {
          tokenMint,
          tokenAmount,
          solAmount: quote.outputAmount,
          executionPrice: parseFloat(quote.outputAmount) / parseFloat(tokenAmount),
          signature,
          priceImpact: quote.priceImpact,
        });

        return {
          success: true,
          signature,
          solAmount: quote.outputAmount,
          executionPrice: parseFloat(quote.outputAmount) / parseFloat(tokenAmount),
        };
      } else {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
    } catch (error) {
      logger.error('Sell trade execution failed', error, { tokenMint, tokenAmount });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get swap quote from Jupiter
   */
  async getSwapQuote(inputMint, outputMint, amount) {
    try {
      const response = await axios.get(`${JUPITER_API}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: Math.floor(amount * 1e9),
          slippageBps: config.execution.slippageTolerance * 100,
        },
        timeout: 5000,
      });

      if (response.data) {
        return {
          inputAmount: response.data.inputAmount,
          outputAmount: response.data.outputAmount,
          priceImpact: response.data.priceImpact,
          routePlan: response.data.routePlan,
        };
      }
      return null;
    } catch (error) {
      logger.error('Failed to get swap quote', error);
      return null;
    }
  }

  /**
   * Get swap instructions from Jupiter
   */
  async getSwapInstructions(inputMint, outputMint, inputAmount, minOutputAmount, slippage) {
    try {
      const response = await axios.post(`${JUPITER_API}/swap-instructions`, {
        userPublicKey: this.wallet.publicKey.toString(),
        quoteResponse: {
          inputMint,
          outputMint,
          inputAmount: Math.floor(inputAmount * 1e9),
          outputAmount: minOutputAmount,
          slippageBps: slippage * 100,
          priceImpactPct: 0,
        },
      }, {
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get swap instructions', error);
      return null;
    }
  }

  /**
   * Build and sign transaction
   */
  async buildAndSignTransaction(swapData) {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }

      // Deserialize instructions
      const instructions = swapData.setupInstructions || [];
      const swapInstruction = swapData.swapInstruction;
      const cleanupInstruction = swapData.cleanupInstruction;

      // Build transaction
      const transaction = new Transaction();
      
      instructions.forEach(instruction => {
        transaction.add(instruction);
      });
      
      transaction.add(swapInstruction);
      
      if (cleanupInstruction) {
        transaction.add(cleanupInstruction);
      }

      // Set payer
      transaction.feePayer = this.wallet.publicKey;
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

      // Sign transaction
      transaction.sign(this.wallet);

      return transaction;
    } catch (error) {
      logger.error('Failed to build/sign transaction', error);
      return null;
    }
  }

  /**
   * Send transaction to blockchain
   */
  async sendTransaction(transaction) {
    try {
      const signature = await this.connection.sendTransaction(transaction, [this.wallet], {
        skipPreflight: false,
        maxRetries: 3,
      });

      logger.debug(`Transaction sent: ${signature}`);
      return signature;
    } catch (error) {
      logger.error('Failed to send transaction', error);
      throw error;
    }
  }

  /**
   * Simulate buy (dry run)
   */
  async simulateBuy(tokenMint, solAmount) {
    try {
      const simulatedTokenAmount = solAmount * 100; // Mock calculation
      const executionPrice = solAmount / simulatedTokenAmount;

      logger.info(`[DRY RUN] Buy simulated: ${solAmount} SOL → ${simulatedTokenAmount} tokens @ ${executionPrice}`);

      return {
        success: true,
        dryRun: true,
        signature: `mock-${Date.now()}`,
        tokenAmount: simulatedTokenAmount,
        executionPrice,
      };
    } catch (error) {
      logger.error('Buy simulation failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Simulate sell (dry run)
   */
  async simulateSell(tokenMint, tokenAmount) {
    try {
      const simulatedSolAmount = tokenAmount / 100; // Mock calculation
      const executionPrice = simulatedSolAmount / tokenAmount;

      logger.info(`[DRY RUN] Sell simulated: ${tokenAmount} tokens → ${simulatedSolAmount} SOL @ ${executionPrice}`);

      return {
        success: true,
        dryRun: true,
        signature: `mock-${Date.now()}`,
        solAmount: simulatedSolAmount,
        executionPrice,
      };
    } catch (error) {
      logger.error('Sell simulation failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get token balance for wallet
   */
  async getTokenBalance(tokenMint) {
    try {
      if (!this.wallet) return 0;

      const tokenAddress = await getAssociatedTokenAddress(
        new PublicKey(tokenMint),
        this.wallet.publicKey
      );

      const balance = await this.connection.getTokenAccountBalance(tokenAddress);
      return balance.value.uiAmount || 0;
    } catch (error) {
      logger.debug(`Failed to get token balance for ${tokenMint}`, error);
      return 0;
    }
  }

  /**
   * Get SOL balance
   */
  async getSolBalance() {
    try {
      if (!this.wallet) return 0;
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance / 1e9;
    } catch (error) {
      logger.error('Failed to get SOL balance', error);
      return 0;
    }
  }
}

export default new TradeExecutor();
