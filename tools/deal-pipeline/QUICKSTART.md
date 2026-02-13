# Quick Start Guide

## 1. Install Dependencies

```bash
cd /Users/penn/.openclaw/workspace/tools/deal-pipeline
npm install
```

## 2. Install Playwright Browser

```bash
npx playwright install chromium
```

## 3. Initialize Database

```bash
npm run init-db
```

## 4. Test Scraper (Single Site)

```bash
# Test BizBuySell scraper
node src/index.js scrape --site bizbuysell

# Or test LoopNet
node src/index.js scrape --site loopnet
```

## 5. View Results

```bash
# List deals in terminal
node src/index.js list

# Export to JSON
node src/index.js export --output test-results.json
```

## 6. Check the Database

```bash
# Using sqlite3 CLI
sqlite3 data/deals.db "SELECT title, price, roi, city FROM deals LIMIT 5;"
```

## Expected Output

After running the scraper, you should see:

```
🔍 Starting deal pipeline scraper...

📊 Scraping BizBuySell...
[BizBuySell] Starting scrape...
[BizBuySell] Searching Phoenix...
[BizBuySell] Searching Houston...
...
[BizBuySell] Found X deals

💾 Saving X deals to database...

✅ Complete!
   New deals: X
   Updated deals: 0
   Total processed: X
```

## Troubleshooting First Run

### Browser Not Found
```bash
npx playwright install
```

### Module Not Found
```bash
npm install
```

### Permission Denied
```bash
chmod +x src/index.js
```

### No Results Found

This is normal! The scrapers target specific sites that may:
- Require authentication
- Have changed their HTML structure
- Block automated access
- Have no matching listings at the moment

**Next step**: Check the logs and inspect the HTML selectors in the scraper files.

## Customization

Before running at scale, review and adjust:

1. **`src/config.js`**: Target cities, filters, delays
2. **Scraper files**: Update selectors if sites have changed
3. **`package.json`**: Add scripts for your workflow

## Production Use

Once tested:

1. Set up cron job (see README)
2. Monitor logs
3. Export daily results
4. Integrate with your deal analysis workflow

---

Happy hunting! 🎯
