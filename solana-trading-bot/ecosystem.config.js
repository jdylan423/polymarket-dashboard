/**
 * PM2 Ecosystem Configuration
 * Enables continuous daemon operation with auto-restart
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 *   pm2 logs
 */

module.exports = {
  apps: [
    {
      name: 'solana-trading-bot',
      script: './src/daemon.js',
      
      // Process management
      instances: 1,
      exec_mode: 'cluster',
      
      // Restart settings
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: '512M',
      
      // Shutdown behavior
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 5000,
      
      // Environment
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max_old_space_size=512',
      },
      
      // Logging
      output: './logs/pm2-out.log',
      error: './logs/pm2-error.log',
      
      // Watch (restart on file changes in dev)
      watch: false, // Set to true for development
      ignore_watch: ['node_modules', 'logs', 'data', 'state'],
      
      // Cluster settings
      merge_logs: true,
      
      // Monitoring
      monitor: true,
      
      // Graceful shutdown
      shutdown_with_message: true,
    },
  ],
  
  // Deployment settings (optional)
  deploy: {
    production: {
      user: 'solana',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/solana-trading-bot.git',
      path: '/opt/solana-trading-bot',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
    },
  },
};
