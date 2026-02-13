import fs from 'fs';
import path from 'path';
import logger from './logger.js';

/**
 * State Management System
 * Handles persistence and recovery of bot state across restarts
 * Includes daily backups for disaster recovery
 */
class StateManager {
  constructor() {
    this.stateDir = path.join(process.cwd(), 'state');
    this.backupDir = path.join(this.stateDir, 'backups');
    this.stateFile = path.join(this.stateDir, 'bot-state.json');
    this.metricsFile = path.join(this.stateDir, 'metrics.json');
    this.heartbeatFile = path.join(this.stateDir, 'heartbeat.json');
    this.lastBackupDate = null;
    this.initializeStateDirectory();
  }

  /**
   * Initialize state directory and backup directory
   */
  initializeStateDirectory() {
    try {
      if (!fs.existsSync(this.stateDir)) {
        fs.mkdirSync(this.stateDir, { recursive: true });
        logger.info('State directory created');
      }
      
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
        logger.info('Backup directory created');
      }
    } catch (error) {
      logger.error('Failed to initialize state directory', error);
    }
  }

  /**
   * Save bot state
   */
  saveState(state) {
    try {
      const stateData = {
        ...state,
        lastSaved: new Date().toISOString(),
        version: '1.0.0',
      };
      fs.writeFileSync(this.stateFile, JSON.stringify(stateData, null, 2));
    } catch (error) {
      logger.error('Failed to save state', error);
    }
  }

  /**
   * Load bot state
   */
  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, 'utf8');
        const state = JSON.parse(data);
        logger.info('State loaded from previous session', {
          lastSaved: state.lastSaved,
          sessionId: state.sessionId,
        });
        return state;
      }
      return this.getDefaultState();
    } catch (error) {
      logger.error('Failed to load state', error);
      return this.getDefaultState();
    }
  }

  /**
   * Get default state
   */
  getDefaultState() {
    return {
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date().toISOString(),
      scanCount: 0,
      tradeCount: 0,
      isRunning: true,
      lastError: null,
      errorCount: 0,
      restartCount: 0,
    };
  }

  /**
   * Save metrics snapshot
   */
  saveMetrics(metrics) {
    try {
      const metricsData = {
        ...metrics,
        timestamp: new Date().toISOString(),
      };
      fs.writeFileSync(this.metricsFile, JSON.stringify(metricsData, null, 2));
    } catch (error) {
      logger.error('Failed to save metrics', error);
    }
  }

  /**
   * Load metrics
   */
  loadMetrics() {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const data = fs.readFileSync(this.metricsFile, 'utf8');
        return JSON.parse(data);
      }
      return this.getDefaultMetrics();
    } catch (error) {
      logger.debug('Failed to load metrics', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get default metrics
   */
  getDefaultMetrics() {
    return {
      totalTrades: 0,
      totalWins: 0,
      totalLosses: 0,
      totalPnl: 0,
      winRate: 0,
      uptime: 0,
      sessionCount: 0,
      restartCount: 0,
    };
  }

  /**
   * Record heartbeat
   */
  recordHeartbeat(data) {
    try {
      const heartbeatData = {
        ...data,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      };
      fs.writeFileSync(this.heartbeatFile, JSON.stringify(heartbeatData, null, 2));
    } catch (error) {
      logger.error('Failed to record heartbeat', error);
    }
  }

  /**
   * Get last heartbeat
   */
  getLastHeartbeat() {
    try {
      if (fs.existsSync(this.heartbeatFile)) {
        const data = fs.readFileSync(this.heartbeatFile, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      logger.debug('Failed to get last heartbeat', error);
      return null;
    }
  }

  /**
   * Update state on error
   */
  recordError(error, context = {}) {
    try {
      const state = this.loadState();
      state.lastError = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      };
      state.errorCount = (state.errorCount || 0) + 1;
      this.saveState(state);
    } catch (err) {
      logger.error('Failed to record error', err);
    }
  }

  /**
   * Increment restart count
   */
  incrementRestartCount() {
    try {
      const state = this.loadState();
      state.restartCount = (state.restartCount || 0) + 1;
      state.lastRestart = new Date().toISOString();
      this.saveState(state);
      return state.restartCount;
    } catch (error) {
      logger.error('Failed to increment restart count', error);
      return 0;
    }
  }

  /**
   * Clear error state
   */
  clearError() {
    try {
      const state = this.loadState();
      state.lastError = null;
      state.errorCount = 0;
      this.saveState(state);
    } catch (error) {
      logger.error('Failed to clear error', error);
    }
  }

  /**
   * Clean old state files
   */
  cleanup(maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
    try {
      if (fs.existsSync(this.stateDir)) {
        const files = fs.readdirSync(this.stateDir);
        const now = Date.now();

        files.forEach(file => {
          const filePath = path.join(this.stateDir, file);
          const stats = fs.statSync(filePath);
          
          if (now - stats.mtime.getTime() > maxAgeMs) {
            fs.unlinkSync(filePath);
            logger.debug(`Cleaned up old state file: ${file}`);
          }
        });
      }
    } catch (error) {
      logger.error('Failed to cleanup state files', error);
    }
  }

  /**
   * Create a backup of current state
   */
  createBackup() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Only backup once per day
      if (this.lastBackupDate === today) {
        return;
      }

      const backupFile = path.join(this.backupDir, `bot-state-${today}.json`);
      const metricsBackupFile = path.join(this.backupDir, `metrics-${today}.json`);

      // Backup state
      if (fs.existsSync(this.stateFile)) {
        const stateData = fs.readFileSync(this.stateFile, 'utf8');
        fs.writeFileSync(backupFile, stateData);
        logger.info(`Daily state backup created: ${path.basename(backupFile)}`);
      }

      // Backup metrics
      if (fs.existsSync(this.metricsFile)) {
        const metricsData = fs.readFileSync(this.metricsFile, 'utf8');
        fs.writeFileSync(metricsBackupFile, metricsData);
      }

      this.lastBackupDate = today;
      this.cleanupOldBackups();
    } catch (error) {
      logger.error('Failed to create backup', error);
    }
  }

  /**
   * Remove backups older than 30 days
   */
  cleanupOldBackups(maxAgeDays = 30) {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return;
      }

      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

      files.forEach(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAgeMs) {
          fs.unlinkSync(filePath);
          logger.debug(`Cleaned up old backup: ${file}`);
        }
      });
    } catch (error) {
      logger.error('Failed to cleanup old backups', error);
    }
  }

  /**
   * Restore state from backup
   */
  restoreFromBackup(date = null) {
    try {
      let backupFile;
      
      if (date) {
        backupFile = path.join(this.backupDir, `bot-state-${date}.json`);
      } else {
        // Get most recent backup
        const files = fs.readdirSync(this.backupDir)
          .filter(f => f.startsWith('bot-state-') && f.endsWith('.json'))
          .sort()
          .reverse();
        
        if (files.length === 0) {
          logger.warn('No backups found');
          return null;
        }
        
        backupFile = path.join(this.backupDir, files[0]);
      }

      if (!fs.existsSync(backupFile)) {
        logger.warn(`Backup file not found: ${backupFile}`);
        return null;
      }

      const data = fs.readFileSync(backupFile, 'utf8');
      const state = JSON.parse(data);
      
      logger.info(`State restored from backup: ${path.basename(backupFile)}`);
      return state;
    } catch (error) {
      logger.error('Failed to restore from backup', error);
      return null;
    }
  }

  /**
   * Get list of available backups
   */
  listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('bot-state-') && f.endsWith('.json'))
        .sort()
        .reverse();

      return files.map(f => {
        const filePath = path.join(this.backupDir, f);
        const stats = fs.statSync(filePath);
        const date = f.replace('bot-state-', '').replace('.json', '');
        
        return {
          date,
          file: f,
          size: stats.size,
          created: stats.mtime,
        };
      });
    } catch (error) {
      logger.error('Failed to list backups', error);
      return [];
    }
  }
}

export default new StateManager();
