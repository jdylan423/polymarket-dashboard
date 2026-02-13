// pages/api/trades.js
// API endpoint to fetch trades data

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to read trades.json from the bot directory
    const tradesPath = path.join(
      process.cwd(),
      '..',
      'polymarket-paper-trader',
      'trades.json'
    );

    let tradesData = {
      trades: [],
      stats: {
        total_trades: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
        total_pnl: 0,
        consecutive_losses: 0,
        avg_pnl_pct: 0
      }
    };

    // Try to read from local file if it exists
    try {
      if (fs.existsSync(tradesPath)) {
        const fileContent = fs.readFileSync(tradesPath, 'utf8');
        tradesData = JSON.parse(fileContent);
      }
    } catch (fileError) {
      // File doesn't exist or can't be read - return empty data
      console.log('Trades file not found, returning empty data');
    }

    // If still no data, try to read from demo/example data
    if (!tradesData.trades || tradesData.trades.length === 0) {
      tradesData = {
        trades: [],
        stats: {
          total_trades: 0,
          wins: 0,
          losses: 0,
          win_rate: 0,
          total_pnl: 0,
          consecutive_losses: 0,
          avg_pnl_pct: 0
        }
      };
    }

    res.status(200).json(tradesData);
  } catch (error) {
    console.error('Error reading trades data:', error);
    res.status(500).json({
      error: 'Failed to read trades data',
      trades: [],
      stats: {
        total_trades: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
        total_pnl: 0,
        consecutive_losses: 0,
        avg_pnl_pct: 0
      }
    });
  }
}
