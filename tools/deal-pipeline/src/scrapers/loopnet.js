import { chromium } from 'playwright';
import { CONFIG, isTargetMarket, calculateROI } from '../config.js';

export class LoopNetScraper {
  constructor() {
    this.config = CONFIG.sites.loopnet;
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
    console.log(`[LoopNet] Starting scrape...`);
    const deals = [];

    try {
      await this.init();

      // LoopNet uses different search structure - search by keyword and location
      for (const city of CONFIG.targetCities) {
        console.log(`[LoopNet] Searching ${city}...`);
        const cityDeals = await this.scrapeCity(city);
        deals.push(...cityDeals);
        
        await this.delay(CONFIG.scraper.delayBetweenRequests);
      }

      console.log(`[LoopNet] Found ${deals.length} deals`);
    } catch (error) {
      console.error(`[LoopNet] Error:`, error.message);
    } finally {
      await this.close();
    }

    return deals;
  }

  async scrapeCity(city) {
    const deals = [];
    
    // LoopNet search URL format
    const searchUrl = `${this.config.baseUrl}/search/retail-businesses-for-sale/?sk=c8e3a3e3d3&bb=0b3q8tzo2Lw1o-j7vD`;
    const searchWithLocation = `${this.config.baseUrl}/search/?sk=laundromat&bb=${encodeURIComponent(city)}`;

    try {
      await this.page.goto(searchWithLocation, { waitUntil: 'networkidle' });
      
      // Wait for results
      await this.page.waitForSelector('.placard, .property-card, [data-property-id]', { 
        timeout: 10000 
      }).catch(() => null);

      // Extract property cards
      const listings = await this.page.$$eval('.placard, .property-card, [data-property-id]', (elements) => {
        return elements.map(el => {
          const extractText = (selector) => {
            const elem = el.querySelector(selector);
            return elem ? elem.textContent.trim() : null;
          };

          return {
            id: el.getAttribute('data-property-id') || null,
            title: extractText('.placard-title, .property-title, h3'),
            price: extractText('.placard-price, .price'),
            location: extractText('.placard-address, .address, .location'),
            description: extractText('.placard-body, .description'),
            url: el.querySelector('a')?.href || null
          };
        });
      });

      // Process each listing
      for (const listing of listings) {
        if (!listing.url) continue;

        // Only process if title suggests it's a laundromat
        const title = (listing.title || '').toLowerCase();
        if (!title.includes('laundromat') && !title.includes('laundry')) {
          continue;
        }

        const deal = await this.processListing(listing, city);
        if (deal) {
          deals.push(deal);
        }
      }

    } catch (error) {
      console.error(`[LoopNet] Error scraping ${city}:`, error.message);
    }

    return deals;
  }

  async processListing(listing, city) {
    let price = this.extractPrice(listing.price);
    let cashFlow = null;
    let grossIncome = null;
    let contactInfo = {};

    // Try to get detailed financial info from detail page
    try {
      await this.page.goto(listing.url, { waitUntil: 'networkidle', timeout: 15000 });
      
      const details = await this.page.evaluate(() => {
        const extractText = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.textContent.trim() : null;
        };

        const extractByLabel = (label) => {
          const elements = Array.from(document.querySelectorAll('dt, .label, .key'));
          for (const el of elements) {
            if (el.textContent.toLowerCase().includes(label.toLowerCase())) {
              const value = el.nextElementSibling;
              return value ? value.textContent.trim() : null;
            }
          }
          return null;
        };

        return {
          price: extractByLabel('asking price') || extractByLabel('price'),
          cashFlow: extractByLabel('cash flow') || extractByLabel('noi'),
          grossIncome: extractByLabel('gross income') || extractByLabel('revenue'),
          brokerName: extractText('.broker-name, .agent-name'),
          brokerCompany: extractText('.broker-company, .brokerage-name'),
          brokerPhone: extractText('.broker-phone, a[href^="tel:"]'),
          brokerEmail: extractText('.broker-email, a[href^="mailto:"]')
        };
      });

      price = this.extractPrice(details.price) || price;
      cashFlow = this.extractPrice(details.cashFlow);
      grossIncome = this.extractPrice(details.grossIncome);
      contactInfo = {
        brokerName: details.brokerName,
        brokerCompany: details.brokerCompany,
        brokerPhone: details.brokerPhone,
        brokerEmail: details.brokerEmail
      };

      await this.delay(1000);
    } catch (error) {
      console.log(`[LoopNet] Could not get details for ${listing.url}`);
    }

    // Calculate ROI
    const roi = calculateROI(price, cashFlow, grossIncome);

    // Apply filters
    if (price && (price < CONFIG.filters.minPrice || price > CONFIG.filters.maxPrice)) {
      return null;
    }

    if (roi && roi < CONFIG.filters.minROI) {
      return null;
    }

    return {
      external_id: `loopnet_${listing.id || this.hashUrl(listing.url)}`,
      source: 'LoopNet',
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
      contact_name: null,
      contact_phone: null,
      contact_email: null,
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
