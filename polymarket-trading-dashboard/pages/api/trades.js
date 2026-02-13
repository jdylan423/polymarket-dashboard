// pages/api/trades.js
// API endpoint to fetch trades data
// Supports both local file (trades.json) and Supabase database

import fs from 'fs';
import path from 'path';

// Supabase client (optional)
let supabase = null;
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  } catch (e) {
    console.log('Supabase client not available');
  }
}

export default async function handler(req, res) {
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

    // Try Supabase first if configured
    if (supabase) {
      try {
        // Fetch trades
        const { data: trades, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .order('created_at', { ascending: false });

        if (!tradesError && trades) {
          tradesData.trades = trades;
        }

        // Fetch stats
        const { data: stats, error: statsError } = await supabase
          .from('stats')
          .select('*')
          .eq('id', 1)
          .single();

        if (!statsError && stats) {
          tradesData.stats = stats;
        }

        // Successfully got Supabase data
        if (tradesData.trades.length > 0 || tradesData.stats.total_trades > 0) {
          res.status(200).json(tradesData);
          return;
        }
      } catch (supabaseError) {
        console.log('Supabase fetch failed, falling back to local file');
      }
    }

    // Fall back to local trades.json file
    const tradesPath = path.join(
      process.cwd(),
      '..',
      'polymarket-paper-trader',
      'trades.json'
    );

    try {
      if (fs.existsSync(tradesPath)) {
        const fileContent = fs.readFileSync(tradesPath, 'utf8');
        tradesData = JSON.parse(fileContent);
      }
    } catch (fileError) {
      console.log('Local trades file not found or invalid');
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
