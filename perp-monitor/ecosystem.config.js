module.exports = {
  apps: [
    {
      name: "perp-monitor",
      script: "/Users/penn/.openclaw/workspace/perp-monitor/monitor.py",
      interpreter: "python3",
      env: {
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || ""
      },
      error_file: "/Users/penn/.openclaw/workspace/perp-monitor/logs/error.log",
      out_file: "/Users/penn/.openclaw/workspace/perp-monitor/logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      watch: false,
      max_memory_restart: "500M",
      restart_delay: 4000
    }
  ]
};
