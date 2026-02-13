import { chromium } from 'playwright';
import { CONFIG, isTargetMarket, calculateROI } from '../config.js';

export class BizBuySellScraper {
  constructor() {
    this.config = CONFIG.sites.bizbuysell;
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await chromium.launch({
      headless: CONFIG.scraper.headless
    });
    
    const context = await this.browser.newContext({
      userAgent: CONFIG.scraper.userAgent
    });
    
    this.page = await context.newPage();
    this.page.setDefaultTimeout(CONFIG.scraper.timeout);
  }

  async scrape() {
    console.log(`[BizBuySell] Starting scrape...`);
    const deals = [];

    try {
      await this.init();

      // Search for laundromats in each target market
      for (const city of CONFIG.targetCities) {
        console.log(`[BizBuySell] Searching ${city}...`);
        const cityDeals = await this.scrapeCity(city);
        deals.push(...cityDeals);
        
        // Delay between requests
        await this.delay(CONFIG.scraper.delayBetweenRequests);
      }

      console.log(`[BizBuySell] Found ${deals.length} deals`);
    } catch (error) {
      console.error(`[BizBuySell] Error:`, error.message);
    } finally {
      await this.close();
    }

    return deals;
  }

  async scrapeCity(city) {
    const deals = [];
    const searchUrl = `${this.config.baseUrl}/businesses-for-sale/${city.toLowerCase().replace(/\s+/g, '-')}/laundromat/`;

    try {
      await this.page.goto(searchUrl, { waitUntil: 'networkidle' });
      
      // Wait for listings to load
      await this.page.waitForSelector('.business-item, .listing-item, [data-listing-id]', { 
        timeout: 10000 
      }).catch(() => null);

      // Extract listing cards
      const listings = await this.page.$$eval('[data-listing-id], .business-item, .listing-item', (elements) => {
        return elements.map(el => {
          const extractText = (selector) => {
            const elem = el.querySelector(selector);
            return elem ? elem.textContent.trim() : null;
          };

          const extractNumber = (text) => {
            if (!text) return null;
            const match = text.replace(/[,$]/g, '').match(/[\d.]+/);
            return match ? parseFloat(match[0]) : null;
          };

          return {
            id: el.getAttribute('data-listing-id') || null,
            title: extractText('.title, h3, h2, .listing-title'),
            price: extractText('.price, .asking-price'),
            location: extractText('.location, .city-state'),
            cashFlow: extractText('.cash-flow, [data-label="Cash Flow"]'),
            grossRevenue: extractText('.gross-revenue, .revenue, [data-label="Gross Revenue"]'),
            url: el.querySelector('a')?.href || null,
            description: extractText('.description, .listing-description')
          };
        });
      });

      // Process each listing
      for (const listing of listings) {
        if (!listing.url) continue;

        const deal = await this.processListing(listing, city);
        if (deal) {
          deals.push(deal);
        }
      }

    } catch (error) {
      console.error(`[BizBuySell] Error scraping ${city}:`, error.message);
    }

    return deals;
  }

  async processListing(listing, city) {
    const price = this.extractPrice(listing.price);
    const cashFlow = this.extractPrice(listing.cashFlow);
    const grossIncome = this.extractPrice(listing.grossRevenue);

    // Calculate ROI
    const roi = calculateROI(price, cashFlow, grossIncome);

    // Apply filters
    if (price && (price < CONFIG.filters.minPrice || price > CONFIG.filters.maxPrice)) {
      return null;
    }

    if (roi && roi < CONFIG.filters.minROI) {
      return null;
    }

    // Try to get detailed info by visiting listing page
    let contactInfo = {};
    try {
      await this.page.goto(listing.url, { waitUntil: 'networkidle', timeout: 15000 });
      contactInfo = await this.extractContactInfo();
      await this.delay(1000);
    } catch (error) {
      console.log(`[BizBuySell] Could not get details for ${listing.url}`);
    }

    return {
      external_id: `bizbuysell_${listing.id || this.hashUrl(listing.url)}`,
      source: 'BizBuySell',
      title: listing.title,
      price: price,
      location: listing.location,
      city: city,
      state: this.extractState(listing.location),
      roi: roi,
      cash_flow: cashFlow,
      gross_income: grossIncome,
      url: listing.url,
      description: listing.description,
      contact_name: contactInfo.name,
      contact_phone: contactInfo.phone,
      contact_email: contactInfo.email,
      broker_name: contactInfo.brokerName,
      broker_company: contactInfo.brokerCompany,
      broker_phone: contactInfo.brokerPhone,
      broker_email: contactInfo.brokerEmail,
      listing_date: null,
      metadata: {
        lastScraped: new Date().toISOString()
      }
    };
  }

  async extractContactInfo() {
    const info = await this.page.evaluate(() => {
      const extractText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };

      return {
        name: extractText('.seller-name, .contact-name, .owner-name'),
        phone: extractText('.phone, .contact-phone, a[href^="tel:"]'),
        email: extractText('.email, .contact-email, a[href^="mailto:"]'),
        brokerName: extractText('.broker-name, .agent-name'),
        brokerCompany: extractText('.broker-company, .brokerage'),
        brokerPhone: extractText('.broker-phone'),
        brokerEmail: extractText('.broker-email')
      };
    });

    return info;
  }

  extractPrice(priceText) {
    if (!priceText) return null;
    const cleaned = priceText.replace(/[,$]/g, '');
    const match = cleaned.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  }

  extractState(location) {
    if (!location) return null;
    const stateMatch = location.match(/\b([A-Z]{2})\b/);
    return stateMatch ? stateMatch[1] : null;
  }

  hashUrl(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
