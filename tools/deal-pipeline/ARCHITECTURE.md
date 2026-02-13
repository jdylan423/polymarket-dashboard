# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Deal Pipeline Tracker                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  BizBuySell  │     │   LoopNet    │     │  Future Site │
│   Scraper    │     │   Scraper    │     │   Scraper    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       └────────────────────┼─────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Deal Database │
                    │    (SQLite)    │
                    └───────┬────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
    │ JSON Export  │ │CLI Display│ │ Integration │
    └──────────────┘ └───────────┘ └─────────────┘
```

## Component Breakdown

### 1. Configuration (`src/config.js`)
- Central configuration for all scrapers
- Target markets and filter criteria
- Scraper settings (timeouts, delays, user agent)
- Site-specific URLs and settings

### 2. Database Layer (`src/database.js`)
- SQLite database for persistent storage
- CRUD operations with conflict resolution
- Indexed queries for performance
- Change tracking (first_seen, last_updated)

### 3. Scrapers (`src/scrapers/`)
- **Base Pattern**: Each scraper follows the same interface
  - `init()`: Set up browser context
  - `scrape()`: Main entry point
  - `scrapeCity()`: Search specific market
  - `processListing()`: Extract and normalize deal data
  - `close()`: Clean up resources

- **BizBuySell Scraper**: 
  - Searches by city + keyword
  - Extracts from listing cards
  - Visits detail pages for contact info

- **LoopNet Scraper**:
  - Similar pattern to BizBuySell
  - Different HTML selectors
  - Focus on commercial property data

### 4. CLI Interface (`src/index.js`)
- Command-line interface using Commander.js
- Commands:
  - `scrape`: Run scrapers
  - `export`: Export deals to JSON
  - `list`: Display deals in terminal
  - `init`: Initialize database

### 5. Utilities (`src/utils.js`)
- Helper functions for data processing
- Formatting (currency, percentages)
- Extraction (emails, phones)
- Validation and retry logic

## Data Flow

1. **Scraping Phase**:
   ```
   Scraper → Browser → Website → HTML → Parse → Deal Object
   ```

2. **Storage Phase**:
   ```
   Deal Object → Validate → Normalize → Database → Upsert
   ```

3. **Export Phase**:
   ```
   Database → Query → Filter → Format → JSON File
   ```

## Key Features

### Deduplication
- Uses `external_id` (source + listing ID) as unique constraint
- Prevents duplicate entries
- Updates existing records when data changes

### Change Tracking
- `first_seen`: When deal first appeared
- `last_updated`: When deal data last changed
- Enables tracking of price changes and status updates

### Filtering
Three levels of filtering:

1. **Scraper-level**: Only target markets
2. **Database-level**: ROI, price range, location
3. **Export-level**: Custom filters per export

### Error Handling
- Retry logic with exponential backoff
- Graceful degradation (skip failed listings)
- Detailed logging
- Timeout protection

## Extension Points

### Adding New Scrapers
1. Create `src/scrapers/newsite.js`
2. Implement scraper class:
   ```javascript
   export class NewSiteScraper {
     async init() { /* setup */ }
     async scrape() { /* return deals */ }
     async close() { /* cleanup */ }
   }
   ```
3. Register in `src/config.js` and `src/index.js`

### Custom Filters
Add to `DealDatabase.getFilteredDeals()`:
```javascript
if (filters.customField) {
  query += ' AND custom_field = ?';
  params.push(filters.customField);
}
```

### Additional Exports
Create new export format in `src/index.js`:
```javascript
program
  .command('export-csv')
  .action(async () => {
    // Custom export logic
  });
```

## Performance Considerations

### Scraping Speed
- Sequential by default (respects rate limits)
- Can parallelize different sites
- Delays between requests prevent blocking

### Database
- Indexed columns for fast queries
- SQLite performs well for this use case (<10k records)
- Consider PostgreSQL for >100k records

### Memory
- Playwright browsers use ~100-200MB each
- Close browsers after each site
- Process listings incrementally

## Security & Ethics

### Rate Limiting
- 2-second delay between requests (configurable)
- Respects robots.txt (manual check required)
- Rotatable user agents

### Data Privacy
- Don't store sensitive personal information
- Mask contact info if required
- Comply with terms of service

### Access Control
- No authentication credentials stored in code
- Use environment variables for sensitive data
- Database file permissions should be restricted

## Monitoring

### Logs
- Console output during execution
- File logs via cron script
- Error tracking and debugging

### Metrics to Track
- Deals scraped per run
- New vs. updated deals
- Failed requests
- Average scrape time
- ROI distribution

## Future Enhancements

### Potential Features
1. **Email Notifications**: Alert on high-ROI deals
2. **Web Dashboard**: Visual interface for browsing deals
3. **API Endpoint**: REST API for integrations
4. **ML Filtering**: Predict deal quality
5. **Price Alerts**: Track price changes
6. **Market Analysis**: Aggregate market trends

### Scalability
- Containerize with Docker
- Deploy to cloud (AWS Lambda, etc.)
- Distributed scraping with message queue
- Real-time updates via webhooks

---

**Current Version**: 1.0.0  
**Last Updated**: February 2026
