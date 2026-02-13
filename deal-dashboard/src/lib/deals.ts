import { getDb } from '@/lib/db';
import type { Deal, DealStats } from '@/lib/types';

function parseDealRow(row: Record<string, unknown>): Deal {
  const md = row['metadata'];
  return {
    ...row,
    metadata: typeof md === 'string' ? safeJsonParse(md) : (md ?? null),
  } as Deal;
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return { raw: s };
  }
}

export type DealsQuery = {
  q?: string; // free text in title/location/city/state/source
  city?: string;
  state?: string;
  status?: string;
  minRoi?: number;
  maxRoi?: number;
  minPrice?: number;
  maxPrice?: number;
};

export function listDeals(query: DealsQuery = {}): Deal[] {
  const db = getDb();

  const where: string[] = [];
  const params: Array<string | number> = [];

  if (query.status) {
    where.push('status = ?');
    params.push(query.status);
  }

  if (query.city) {
    where.push('city = ?');
    params.push(query.city);
  }

  if (query.state) {
    where.push('state = ?');
    params.push(query.state);
  }

  if (typeof query.minRoi === 'number') {
    where.push('roi IS NOT NULL AND roi >= ?');
    params.push(query.minRoi);
  }

  if (typeof query.maxRoi === 'number') {
    where.push('roi IS NOT NULL AND roi <= ?');
    params.push(query.maxRoi);
  }

  if (typeof query.minPrice === 'number') {
    where.push('price IS NOT NULL AND price >= ?');
    params.push(query.minPrice);
  }

  if (typeof query.maxPrice === 'number') {
    where.push('price IS NOT NULL AND price <= ?');
    params.push(query.maxPrice);
  }

  if (query.q) {
    where.push(
      '(title LIKE ? OR location LIKE ? OR city LIKE ? OR state LIKE ? OR source LIKE ?)'
    );
    const like = `%${query.q}%`;
    params.push(like, like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT * FROM deals ${whereSql} ORDER BY datetime(last_updated) DESC, datetime(first_seen) DESC`
    )
    .all(...params) as Record<string, unknown>[];

  return rows.map(parseDealRow);
}

export function getStats(): DealStats {
  const db = getDb();

  const totalDeals = (db.prepare('SELECT COUNT(*) as c FROM deals').get() as { c: number }).c;
  const activeDeals = (
    db
      .prepare("SELECT COUNT(*) as c FROM deals WHERE status = 'active'")
      .get() as { c: number }
  ).c;

  const avgRoiRow = db
    .prepare('SELECT AVG(roi) as v FROM deals WHERE roi IS NOT NULL')
    .get() as { v: number | null };
  const avgPriceRow = db
    .prepare('SELECT AVG(price) as v FROM deals WHERE price IS NOT NULL')
    .get() as { v: number | null };

  const updatedLast24h = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM deals
       WHERE datetime(last_updated) >= datetime('now', '-1 day')`
      )
      .get() as { c: number }
  ).c;

  // Price distribution buckets
  const buckets = [
    { label: '< $150k', min: 0, max: 149999 },
    { label: '$150k–$300k', min: 150000, max: 300000 },
    { label: '$300k–$600k', min: 300001, max: 600000 },
    { label: '$600k–$1M', min: 600001, max: 1000000 },
    { label: '$1M–$1.5M', min: 1000001, max: 1500000 },
    { label: '> $1.5M', min: 1500001, max: 1000000000 },
  ];

  const priceBuckets = buckets.map((b) => {
    const count = (
      db
        .prepare(
          'SELECT COUNT(*) as c FROM deals WHERE price IS NOT NULL AND price BETWEEN ? AND ?'
        )
        .get(b.min, b.max) as { c: number }
    ).c;
    return { ...b, count };
  });

  return {
    totalDeals,
    activeDeals,
    avgRoi: avgRoiRow?.v ?? null,
    avgPrice: avgPriceRow?.v ?? null,
    updatedLast24h,
    priceBuckets,
  };
}
