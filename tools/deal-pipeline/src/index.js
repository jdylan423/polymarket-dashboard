#!/usr/bin/env node

import { Command } from 'commander';
import { DealDatabase } from './database.js';
import { BizBuySellScraper } from './scrapers/bizbuysell.js';
import { LoopNetScraper } from './scrapers/loopnet.js';
import { CONFIG } from './config.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('deal-pipeline')
  .description('Laundromat deal pipeline tracker')
  .version('1.0.0');

program
  .command('scrape')
  .description('Scrape all configured sites for new deals')
  .option('-s, --site <site>', 'Scrape specific site only (bizbuysell, loopnet)')
  .action(async (options) => {
    console.log('🔍 Starting deal pipeline scraper...\n');
    
    const db = new DealDatabase();
    const allDeals = [];

    try {
      // Run scrapers
      const scrapers = [];
      
      if (!options.site || options.site === 'bizbuysell') {
        if (CONFIG.sites.bizbuysell.enabled) {
          scrapers.push({ name: 'BizBuySell', scraper: new BizBuySellScraper() });
        }
      }
      
      if (!options.site || options.site === 'loopnet') {
        if (CONFIG.sites.loopnet.enabled) {
          scrapers.push({ name: 'LoopNet', scraper: new LoopNetScraper() });
        }
      }

      // Run all scrapers
      for (const { name, scraper } of scrapers) {
        console.log(`\n📊 Scraping ${name}...`);
        const deals = await scraper.scrape();
        allDeals.push(...deals);
      }

      // Save to database
      console.log(`\n💾 Saving ${allDeals.length} deals to database...`);
      let newCount = 0;
      let updatedCount = 0;

      for (const deal of allDeals) {
        const isNew = db.upsertDeal(deal);
        if (isNew) {
          newCount++;
        } else {
          updatedCount++;
        }
      }

      console.log(`\n✅ Complete!`);
      console.log(`   New deals: ${newCount}`);
      console.log(`   Updated deals: ${updatedCount}`);
      console.log(`   Total processed: ${allDeals.length}`);

    } catch (error) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    } finally {
      db.close();
    }
  });

program
  .command('export')
  .description('Export deals to JSON')
  .option('-n, --new', 'Export only new deals from today')
  .option('-u, --updated', 'Export only updated deals from today')
  .option('-a, --all', 'Export all deals (default)')
  .option('-f, --filter', 'Apply ROI and price filters')
  .option('-o, --output <file>', 'Output file path', 'deals.json')
  .action(async (options) => {
    const db = new DealDatabase();

    try {
      let deals = [];
      const today = new Date().toISOString().split('T')[0];

      if (options.new) {
        console.log('📤 Exporting new deals from today...');
        deals = db.getNewDeals(today);
      } else if (options.updated) {
        console.log('📤 Exporting updated deals from today...');
        deals = db.getUpdatedDeals(today);
      } else if (options.filter) {
        console.log('📤 Exporting filtered deals...');
        deals = db.getFilteredDeals({
          minROI: CONFIG.filters.minROI,
          minPrice: CONFIG.filters.minPrice,
          maxPrice: CONFIG.filters.maxPrice,
          cities: CONFIG.targetCities
        });
      } else {
        console.log('📤 Exporting all deals...');
        deals = db.getAllDeals();
      }

      // Parse metadata JSON
      const formattedDeals = deals.map(deal => ({
        ...deal,
        metadata: deal.metadata ? JSON.parse(deal.metadata) : null
      }));

      // Determine output path
      const outputPath = options.output.startsWith('/') 
        ? options.output 
        : join(__dirname, '../exports', options.output);

      // Write JSON
      writeFileSync(outputPath, JSON.stringify(formattedDeals, null, 2));

      console.log(`\n✅ Exported ${formattedDeals.length} deals to: ${outputPath}`);

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    } finally {
      db.close();
    }
  });

program
  .command('list')
  .description('List deals from database')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .option('--min-roi <number>', 'Minimum ROI %')
  .action(async (options) => {
    const db = new DealDatabase();

    try {
      const filters = {};
      if (options.minRoi) {
        filters.minROI = parseFloat(options.minRoi);
      }

      const deals = db.getFilteredDeals(filters);
      const limited = deals.slice(0, parseInt(options.limit));

      console.log(`\n📋 Showing ${limited.length} of ${deals.length} deals:\n`);

      for (const deal of limited) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📍 ${deal.title || 'Untitled'}`);
        console.log(`   Source: ${deal.source}`);
        console.log(`   Location: ${deal.city}, ${deal.state}`);
        console.log(`   Price: $${deal.price?.toLocaleString() || 'N/A'}`);
        console.log(`   ROI: ${deal.roi ? deal.roi.toFixed(1) + '%' : 'N/A'}`);
        console.log(`   Cash Flow: $${deal.cash_flow?.toLocaleString() || 'N/A'}`);
        if (deal.broker_name) {
          console.log(`   Broker: ${deal.broker_name}`);
        }
        console.log(`   URL: ${deal.url}`);
      }

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    } finally {
      db.close();
    }
  });

program
  .command('init')
  .description('Initialize database')
  .action(() => {
    const db = new DealDatabase();
    console.log('✅ Database initialized successfully');
    db.close();
  });

// Default action
if (process.argv.length === 2) {
  program.help();
}

program.parse();
