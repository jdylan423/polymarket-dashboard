export const CONFIG = {
  // Target markets
  targetCities: [
    'Phoenix',
    'Houston',
    'Atlanta',
    'Dallas',
    'Fort Worth',
    'Los Angeles'
  ],

  // Filter criteria
  filters: {
    minROI: 20, // Minimum ROI percentage
    minPrice: 150000,
    maxPrice: 1500000
  },

  // Search keywords
  keywords: [
    'laundromat',
    'laundry',
    'coin laundry',
    'wash and fold',
    'laundry service'
  ],

  // Scraper settings
  scraper: {
    headless: true,
    timeout: 30000,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    delayBetweenRequests: 2000, // ms
    maxRetries: 3
  },

  // Site-specific selectors and URLs
  sites: {
    bizbuysell: {
      name: 'BizBuySell',
      baseUrl: 'https://www.bizbuysell.com',
      searchUrl: 'https://www.bizbuysell.com/businesses-for-sale/laundromat/',
      enabled: true
    },
    loopnet: {
      name: 'LoopNet',
      baseUrl: 'https://www.loopnet.com',
      searchUrl: 'https://www.loopnet.com/search/retail-businesses-for-sale/laundromat/',
      enabled: true
    },
    businessbroker: {
      name: 'BusinessBroker.net',
      baseUrl: 'https://www.businessbroker.net',
      searchUrl: 'https://www.businessbroker.net/businesses-for-sale/laundromat/',
      enabled: false // Can be enabled later
    }
  }
};

// Helper to normalize city names for matching
export function normalizeCityName(city) {
  if (!city) return '';
  return city.trim().toLowerCase().replace(/[^a-z\s]/g, '');
}

// Check if location matches target markets
export function isTargetMarket(location, city, state) {
  const normalizedLocation = normalizeCityName(location || '');
  const normalizedCity = normalizeCityName(city || '');
  
  for (const targetCity of CONFIG.targetCities) {
    const normalized = normalizeCityName(targetCity);
    if (normalizedLocation.includes(normalized) || normalizedCity.includes(normalized)) {
      return true;
    }
  }
  
  return false;
}

// Calculate ROI from financial data
export function calculateROI(price, cashFlow, grossIncome) {
  if (!price || price === 0) return null;
  
  // If cash flow is provided, use it
  if (cashFlow && cashFlow > 0) {
    return (cashFlow / price) * 100;
  }
  
  // Otherwise estimate from gross income (assume 35% margin)
  if (grossIncome && grossIncome > 0) {
    const estimatedCashFlow = grossIncome * 0.35;
    return (estimatedCashFlow / price) * 100;
  }
  
  return null;
}
