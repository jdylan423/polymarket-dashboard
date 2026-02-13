import fs from 'fs';
import path from 'path';
import logger from './logger.js';

/**
 * Heartbeat Health Check System
 * Tracks bot vitality with periodic status updates
 */
class HeartbeatSystem {
  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    this.heartbeatFile = path.join(this.logsDir, 'heartbeat.log');
    this.heartbeatHistory = [];
    this.maxHistorySize = 1000;
    this.sessionData = null;
    this.initializeLogsDirectory();
  }

  /**
   * Initialize logs directory
   */
  initializeLogsDirectory() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
        logger.info('Logs directory created');
      }
    } catch (error) {
      logger.error('Failed to initialize logs directory', error);
    }
  }

  /**
   * Initialize heartbeat system with session data
   */
  initialize(data) {
    this.sessionData = {
      ...data,
      initTime: new Date().toISOString(),
    };
    
    this.writeHeartbeat({
      event: 'SESSION_START',
      ...this.sessionData,
    });
  }

  /**
   * Record a heartbeat
   */
  recordHeartbeat(data) {
    try {
      const heartbeat = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
        ...data,
      };

      this.writeHeartbeat(heartbeat);
      this.heartbeatHistory.push(heartbeat);

      // Keep history size bounded
      if (this.heartbeatHistory.length > this.maxHistorySize) {
        this.heartbeatHistory.shift();
      }
    } catch (error) {
      logger.error('Failed to record heartbeat', error);
    }
  }

  /**
   * Write heartbeat to log file
   */
  writeHeartbeat(data) {
    try {
      const entry = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.heartbeatFile, line);
    } catch (error) {
      logger.warn('Failed to write heartbeat to file', error);
    }
  }

  /**
   * Get last N heartbeats
   */
  getLastHeartbeats(count = 10) {
    try {
      return this.heartbeatHistory.slice(-count);
    } catch (error) {
      logger.error('Failed to get last heartbeats', error);
      return [];
    }
  }

  /**
   * Get health status based on heartbeat history
   */
  getHealthStatus() {
    try {
      if (this.heartbeatHistory.length === 0) {
        return { status: 'unknown', reason: 'No heartbeat data' };
      }

      const lastHeartbeat = this.heartbeatHistory[this.heartbeatHistory.length - 1];
      const now = new Date();
      const lastBeatTime = new Date(lastHeartbeat.timestamp);
      const timeSinceLastBeat = now - lastBeatTime;

      if (timeSinceLastBeat > 10 * 60 * 1000) { // 10 minutes
        return { 
          status: 'critical', 
          reason: 'No heartbeat for 10+ minutes',
          lastBeat: lastHeartbeat.timestamp,
        };
      }

      if (timeSinceLastBeat > 6 * 60 * 1000) { // 6 minutes
        return { 
          status: 'warning', 
          reason: 'No heartbeat for 6+ minutes',
          lastBeat: lastHeartbeat.timestamp,
        };
      }

      // Check memory
      const memoryPercent = (lastHeartbeat.memoryUsage.heapUsed / lastHeartbeat.memoryUsage.heapTotal) * 100;
      if (memoryPercent > 90) {
        return { 
          status: 'warning', 
          reason: 'High memory usage',
          memory: `${memoryPercent.toFixed(1)}%`,
        };
      }

      return { 
        status: 'healthy', 
        reason: 'All systems operational',
        lastBeat: lastHeartbeat.timestamp,
      };
    } catch (error) {
      logger.error('Failed to get health status', error);
      return { status: 'error', reason: error.message };
    }
  }

  /**
   * Get heartbeat statistics
   */
  getHeartbeatStats() {
    try {
      if (this.heartbeatHistory.length === 0) {
        return null;
      }

      const heartbeats = this.heartbeatHistory;
      const memoryValues = heartbeats.map(h => h.memoryUsage?.heapUsed || 0);
      const errorCounts = heartbeats.map(h => h.errors || 0);

      return {
        totalHeartbeats: heartbeats.length,
        timeSpan: {
          start: heartbeats[0].timestamp,
          end: heartbeats[heartbeats.length - 1].timestamp,
        },
        memory: {
          min: Math.min(...memoryValues),
          max: Math.max(...memoryValues),
          avg: Math.round(memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length),
        },
        errors: {
          min: Math.min(...errorCounts),
          max: Math.max(...errorCounts),
          total: errorCounts.reduce((a, b) => a + b, 0),
        },
        latestHeartbeat: heartbeats[heartbeats.length - 1],
      };
    } catch (error) {
      logger.error('Failed to get heartbeat stats', error);
      return null;
    }
  }

  /**
   * Export heartbeat data to file
   */
  exportHeartbeats(filepath) {
    try {
      const data = {
        sessionData: this.sessionData,
        heartbeats: this.heartbeatHistory,
        stats: this.getHeartbeatStats(),
        exportTime: new Date().toISOString(),
      };

      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      logger.info(`Heartbeat data exported to ${filepath}`);
      return true;
    } catch (error) {
      logger.error('Failed to export heartbeat data', error);
      return false;
    }
  }

  /**
   * Clear heartbeat history
   */
  clearHistory() {
    try {
      this.heartbeatHistory = [];
      logger.info('Heartbeat history cleared');
    } catch (error) {
      logger.error('Failed to clear heartbeat history', error);
    }
  }

  /**
   * Create a heartbeat summary report
   */
  generateSummaryReport() {
    try {
      const stats = this.getHeartbeatStats();
      const health = this.getHealthStatus();

      if (!stats) {
        return { error: 'No heartbeat data available' };
      }

      return {
        health: health,
        summary: {
          totalHeartbeats: stats.totalHeartbeats,
          timeSpanMinutes: Math.round(
            (new Date(stats.timeSpan.end) - new Date(stats.timeSpan.start)) / 1000 / 60
          ),
        },
        memory: {
          current: `${stats.memory.max}MB`,
          average: `${stats.memory.avg}MB`,
          minimum: `${stats.memory.min}MB`,
        },
        errors: {
          total: stats.errors.total,
          maxConsecutive: stats.errors.max,
        },
        uptime: `${(stats.latestHeartbeat.uptime / 60 / 60).toFixed(2)} hours`,
        lastUpdate: stats.timeSpan.end,
      };
    } catch (error) {
      logger.error('Failed to generate summary report', error);
      return { error: error.message };
    }
  }
}

export default new HeartbeatSystem();
