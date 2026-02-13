#!/bin/bash

# Laundromat Deal Pipeline - Cron Script
# This script runs the scraper and exports results

# Configuration
PIPELINE_DIR="/Users/penn/.openclaw/workspace/tools/deal-pipeline"
LOG_DIR="$PIPELINE_DIR/logs"
EXPORT_DIR="$PIPELINE_DIR/exports"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

# Create directories if they don't exist
mkdir -p "$LOG_DIR"
mkdir -p "$EXPORT_DIR"

# Change to pipeline directory
cd "$PIPELINE_DIR" || exit 1

# Log start
echo "[$TIMESTAMP] Starting laundromat deal pipeline scraper" >> "$LOG_DIR/cron.log"

# Run scraper
/usr/local/bin/node src/index.js scrape >> "$LOG_DIR/scrape_${DATE}.log" 2>&1
SCRAPE_EXIT=$?

# Log scrape result
if [ $SCRAPE_EXIT -eq 0 ]; then
    echo "[$TIMESTAMP] Scrape completed successfully" >> "$LOG_DIR/cron.log"
    
    # Export new and updated deals
    /usr/local/bin/node src/index.js export \
        --new \
        --output "$EXPORT_DIR/new_deals_${DATE}.json" \
        >> "$LOG_DIR/export_${DATE}.log" 2>&1
    
    /usr/local/bin/node src/index.js export \
        --filter \
        --output "$EXPORT_DIR/filtered_deals_${DATE}.json" \
        >> "$LOG_DIR/export_${DATE}.log" 2>&1
    
    echo "[$TIMESTAMP] Export completed" >> "$LOG_DIR/cron.log"
else
    echo "[$TIMESTAMP] Scrape failed with exit code $SCRAPE_EXIT" >> "$LOG_DIR/cron.log"
fi

# Clean up old logs (keep last 30 days)
find "$LOG_DIR" -name "*.log" -mtime +30 -delete
find "$EXPORT_DIR" -name "*.json" -mtime +30 -delete

echo "[$TIMESTAMP] Pipeline run completed" >> "$LOG_DIR/cron.log"
