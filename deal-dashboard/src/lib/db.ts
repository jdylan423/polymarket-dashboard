import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function getDealsDbPath() {
  const fromEnv = process.env.DEALS_DB_PATH;
  if (fromEnv) return fromEnv;

  // Default: reuse existing deal-pipeline DB in workspace
  return path.join(
    process.cwd(),
    '..',
    'tools',
    'deal-pipeline',
    'data',
    'deals.db'
  );
}

let _db: Database.Database | null = null;

export function getDb() {
  if (_db) return _db;

  const dbPath = getDealsDbPath();
  if (!fs.existsSync(dbPath)) {
    throw new Error(
      `Deals database not found at ${dbPath}. Set DEALS_DB_PATH in .env.local to override.`
    );
  }

  _db = new Database(dbPath, {
    readonly: true,
    fileMustExist: true,
  });

  // Better concurrency when deal-pipeline writes via WAL
  _db.pragma('journal_mode = WAL');

  return _db;
}
