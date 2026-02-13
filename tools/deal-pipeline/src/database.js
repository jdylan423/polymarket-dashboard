import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../data/deals.db');

export class DealDatabase {
  constructor() {
    this.db = new Database(DB_PATH);
    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        external_id TEXT UNIQUE,
        source TEXT NOT NULL,
        title TEXT,
        price REAL,
        location TEXT,
        city TEXT,
        state TEXT,
        roi REAL,
        cash_flow REAL,
        gross_income REAL,
        url TEXT,
        description TEXT,
        contact_name TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        broker_name TEXT,
        broker_company TEXT,
        broker_phone TEXT,
        broker_email TEXT,
        listing_date TEXT,
        first_seen TEXT DEFAULT CURRENT_TIMESTAMP,
        last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        metadata TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_source ON deals(source);
      CREATE INDEX IF NOT EXISTS idx_city ON deals(city);
      CREATE INDEX IF NOT EXISTS idx_price ON deals(price);
      CREATE INDEX IF NOT EXISTS idx_roi ON deals(roi);
      CREATE INDEX IF NOT EXISTS idx_status ON deals(status);
      CREATE INDEX IF NOT EXISTS idx_last_updated ON deals(last_updated);
    `);
  }

  upsertDeal(deal) {
    const stmt = this.db.prepare(`
      INSERT INTO deals (
        external_id, source, title, price, location, city, state, roi,
        cash_flow, gross_income, url, description,
        contact_name, contact_phone, contact_email,
        broker_name, broker_company, broker_phone, broker_email,
        listing_date, metadata
      ) VALUES (
        @external_id, @source, @title, @price, @location, @city, @state, @roi,
        @cash_flow, @gross_income, @url, @description,
        @contact_name, @contact_phone, @contact_email,
        @broker_name, @broker_company, @broker_phone, @broker_email,
        @listing_date, @metadata
      )
      ON CONFLICT(external_id) DO UPDATE SET
        title = excluded.title,
        price = excluded.price,
        location = excluded.location,
        city = excluded.city,
        state = excluded.state,
        roi = excluded.roi,
        cash_flow = excluded.cash_flow,
        gross_income = excluded.gross_income,
        description = excluded.description,
        contact_name = excluded.contact_name,
        contact_phone = excluded.contact_phone,
        contact_email = excluded.contact_email,
        broker_name = excluded.broker_name,
        broker_company = excluded.broker_company,
        broker_phone = excluded.broker_phone,
        broker_email = excluded.broker_email,
        last_updated = CURRENT_TIMESTAMP,
        metadata = excluded.metadata
    `);

    const info = stmt.run({
      ...deal,
      metadata: deal.metadata ? JSON.stringify(deal.metadata) : null
    });

    return info.changes > 0;
  }

  getNewDeals(sinceDate) {
    const stmt = this.db.prepare(`
      SELECT * FROM deals
      WHERE first_seen >= ?
      ORDER BY first_seen DESC
    `);
    return stmt.all(sinceDate);
  }

  getUpdatedDeals(sinceDate) {
    const stmt = this.db.prepare(`
      SELECT * FROM deals
      WHERE last_updated >= ? AND first_seen < ?
      ORDER BY last_updated DESC
    `);
    return stmt.all(sinceDate, sinceDate);
  }

  getFilteredDeals(filters = {}) {
    let query = 'SELECT * FROM deals WHERE status = ?';
    const params = ['active'];

    if (filters.minROI) {
      query += ' AND roi >= ?';
      params.push(filters.minROI);
    }

    if (filters.minPrice) {
      query += ' AND price >= ?';
      params.push(filters.minPrice);
    }

    if (filters.maxPrice) {
      query += ' AND price <= ?';
      params.push(filters.maxPrice);
    }

    if (filters.cities && filters.cities.length > 0) {
      const placeholders = filters.cities.map(() => '?').join(',');
      query += ` AND city IN (${placeholders})`;
      params.push(...filters.cities);
    }

    query += ' ORDER BY roi DESC, price ASC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  getAllDeals() {
    return this.db.prepare('SELECT * FROM deals ORDER BY last_updated DESC').all();
  }

  close() {
    this.db.close();
  }
}

// CLI init
if (process.argv.includes('--init')) {
  const db = new DealDatabase();
  console.log('Database initialized at:', DB_PATH);
  db.close();
}
