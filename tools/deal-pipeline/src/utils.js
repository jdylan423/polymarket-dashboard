/**
 * Utility functions for the deal pipeline
 */

/**
 * Format currency
 */
export function formatCurrency(amount) {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(value) {
  if (!value) return 'N/A';
  return `${value.toFixed(1)}%`;
}

/**
 * Extract email from text
 */
export function extractEmail(text) {
  if (!text) return null;
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
  const match = text.match(emailRegex);
  return match ? match[1] : null;
}

/**
 * Extract phone number from text
 */
export function extractPhone(text) {
  if (!text) return null;
  // Match various phone formats
  const phoneRegex = /(\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : null;
}

/**
 * Clean and normalize text
 */
export function cleanText(text) {
  if (!text) return null;
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Calculate days since date
 */
export function daysSince(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }
}

/**
 * Parse deal metrics from text
 */
export function parseMetrics(text) {
  if (!text) return {};
  
  const metrics = {};
  
  // Extract price
  const priceMatch = text.match(/\$\s?([\d,]+)/);
  if (priceMatch) {
    metrics.price = parseFloat(priceMatch[1].replace(/,/g, ''));
  }
  
  // Extract ROI
  const roiMatch = text.match(/(\d+\.?\d*)%\s*ROI/i);
  if (roiMatch) {
    metrics.roi = parseFloat(roiMatch[1]);
  }
  
  // Extract cash flow
  const cashFlowMatch = text.match(/cash\s*flow[:\s]*\$\s?([\d,]+)/i);
  if (cashFlowMatch) {
    metrics.cashFlow = parseFloat(cashFlowMatch[1].replace(/,/g, ''));
  }
  
  return metrics;
}

/**
 * Validate deal object
 */
export function validateDeal(deal) {
  const errors = [];
  
  if (!deal.external_id) errors.push('Missing external_id');
  if (!deal.source) errors.push('Missing source');
  if (!deal.url) errors.push('Missing url');
  
  if (deal.price !== null && deal.price !== undefined) {
    if (deal.price < 0) errors.push('Invalid price (negative)');
    if (deal.price > 100000000) errors.push('Invalid price (too high)');
  }
  
  if (deal.roi !== null && deal.roi !== undefined) {
    if (deal.roi < 0) errors.push('Invalid ROI (negative)');
    if (deal.roi > 1000) errors.push('Invalid ROI (too high)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate deal summary
 */
export function generateSummary(deal) {
  const parts = [];
  
  if (deal.title) parts.push(deal.title);
  if (deal.city && deal.state) parts.push(`${deal.city}, ${deal.state}`);
  if (deal.price) parts.push(formatCurrency(deal.price));
  if (deal.roi) parts.push(`${formatPercent(deal.roi)} ROI`);
  
  return parts.join(' | ');
}
