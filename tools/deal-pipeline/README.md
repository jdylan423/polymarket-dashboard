# 🏪 Laundromat Deal Pipeline Tracker

Automated web scraping system to monitor laundromat business listings across multiple platforms (BizBuySell, LoopNet, etc.) and track deals that meet your investment criteria.

## Features

- 🔍 **Multi-Platform Scraping**: BizBuySell, LoopNet support
- 🎯 **Target Market Filtering**: Phoenix, Houston, Atlanta, Dallas-Fort Worth, Los Angeles
- 💰 **Financial Criteria**: ROI >20%, Price $150K-$1.5M
- 💾 **SQLite Database**: Persistent storage with change tracking
- 📊 **JSON Export**: Easy integration with other tools
- 📞 **Contact Extraction**: Owner and broker information when available
- 🔄 **Update Detection**: Track new listings and price changes

## Installation

```bash
cd /Users/penn/.openclaw/workspace/tools/deal-pipeline
npm install
npm run init-db
```

### Install Playwright Browsers

```bash
npx playwright install chromium
```

## Configuration

Edit `src/config.js` to customize:

- **Target cities**: Add or remove markets
- **Filter criteria**: Adjust ROI, price range
- **Scraper settings**: Timeout, delays, headless mode
- **Enable/disable sites**: Toggle scrapers on/off

```javascript
export const CONFIG = {
  targetCities: ['Phoenix', 'Houston', 'Atlanta', 'Dallas', 'Fort Worth', 'Los Angeles'],
  filters: {
    minROI: 20,
    minPrice: 150000,
    maxPrice: 1500000
  }
};
```

## Usage

### Scrape All Sites

```bash
npm run scrape
# or
node src/index.js scrape
```

### Scrape Specific Site

```bash
node src/index.js scrape --site bizbuysell
node src/index.js scrape --site loopnet
```

### Export Deals to JSON

```bash
# Export all deals
npm run export

# Export only new deals from today
node src/index.js export --new

# Export only updated deals
node src/index.js export --updated

# Export with filters applied
node src/index.js export --filter

# Custom output path
node src/index.js export --output my-deals.json
```

### List Deals in Terminal

```bash
# Show top 10 deals
node src/index.js list

# Show top 20 deals
node src/index.js list --limit 20

# Filter by minimum ROI
node src/index.js list --min-roi 25
```

### Initialize Database

```bash
node src/index.js init
```

## Data Structure

### Deal Object

Each deal in the database contains:

```javascript
{
  "id": 1,
  "external_id": "bizbuysell_abc123",
  "source": "BizBuySell",
  "title": "Profitable Laundromat - High Traffic Area",
  "price": 450000,
  "location": "Phoenix, AZ",
  "city": "Phoenix",
  "state": "AZ",
  "roi": 28.5,
  "cash_flow": 128250,
  "gross_income": 366428,
  "url": "https://www.bizbuysell.com/...",
  "description": "Established laundromat in high-traffic strip mall...",
  "contact_name": "John Smith",
  "contact_phone": "555-123-4567",
  "contact_email": "john@example.com",
  "broker_name": "Jane Doe",
  "broker_company": "ABC Business Brokers",
  "broker_phone": "555-987-6543",
  "broker_email": "jane@abcbrokers.com",
  "listing_date": "2026-01-15",
  "first_seen": "2026-02-06 09:30:00",
  "last_updated": "2026-02-06 09:30:00",
  "status": "active",
  "metadata": {
    "lastScraped": "2026-02-06T14:30:00.000Z"
  }
}
```

See `example-data.json` for a complete sample dataset.

## Database Schema

**Table: `deals`**

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| external_id | TEXT | Unique identifier (source + listing ID) |
| source | TEXT | Platform name (BizBuySell, LoopNet) |
| title | TEXT | Listing title |
| price | REAL | Asking price |
| location | TEXT | Full location string |
| city | TEXT | City name |
| state | TEXT | State code |
| roi | REAL | Return on investment % |
| cash_flow | REAL | Annual cash flow |
| gross_income | REAL | Annual gross income |
| url | TEXT | Listing URL |
| description | TEXT | Listing description |
| contact_name | TEXT | Owner/seller name |
| contact_phone | TEXT | Owner/seller phone |
| contact_email | TEXT | Owner/seller email |
| broker_name | TEXT | Broker name |
| broker_company | TEXT | Broker company |
| broker_phone | TEXT | Broker phone |
| broker_email | TEXT | Broker email |
| listing_date | TEXT | Original listing date |
| first_seen | TEXT | First scraped timestamp |
| last_updated | TEXT | Last scraped timestamp |
| status | TEXT | active/sold/removed |
| metadata | TEXT | JSON metadata |

## Automation

### Cron Job Setup

Run scraper daily at 9 AM:

```bash
# Edit crontab
crontab -e

# Add line:
0 9 * * * cd /Users/penn/.openclaw/workspace/tools/deal-pipeline && /usr/local/bin/node src/index.js scrape >> logs/scrape.log 2>&1
```

### Create Log Directory

```bash
mkdir -p logs
```

## ROI Calculation

The system calculates ROI using:

1. **If cash flow is provided**: `ROI = (Cash Flow / Price) × 100`
2. **If only gross income is provided**: Estimates 35% net margin
   - `Estimated Cash Flow = Gross Income × 0.35`
   - `ROI = (Estimated Cash Flow / Price) × 100`

You can adjust the margin assumption in `src/config.js`.

## Adding New Scrapers

To add support for another site:

1. Create `src/scrapers/sitename.js`
2. Implement the scraper class with `scrape()` method
3. Add site config to `src/config.js`
4. Import and add to `src/index.js`

Template:

```javascript
export class NewSiteScraper {
  async scrape() {
    // Return array of deal objects
    return deals;
  }
}
```

## Troubleshooting

### Scraper Times Out

- Increase timeout in `src/config.js`:
  ```javascript
  scraper: { timeout: 60000 }
  ```

### Selectors Not Working

Websites frequently update their HTML. Update selectors in the scraper files:

- `src/scrapers/bizbuysell.js`
- `src/scrapers/loopnet.js`

### Browser Not Found

Install Playwright browsers:

```bash
npx playwright install chromium
```

### Database Locked

Close any other processes accessing the database:

```bash
lsof data/deals.db
```

## Ethical Considerations

- **Respect robots.txt**: Check each site's crawling policy
- **Rate limiting**: Built-in delays between requests
- **Terms of service**: Review each platform's TOS
- **Data usage**: Use scraped data responsibly and legally

## License

MIT

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review database with: `sqlite3 data/deals.db`
- Enable debug mode: Set `headless: false` in config to watch browser

---

**Last Updated**: February 2026
