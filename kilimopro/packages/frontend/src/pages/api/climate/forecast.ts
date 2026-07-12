/**
 * KilimoPRO 2.0 — Climate Forecast API (ICPAC)
 * GET /api/climate/forecast?region=eastern
 * GET /api/climate/forecast?country=KE
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { DataAggregator } from '@/lib/data/aggregator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { region, limit } = req.query;

  try {
    let forecasts = await DataAggregator.getClimateForecast(region as string);

    const maxLimit = parseInt((limit as string) || '5', 10);
    forecasts = forecasts.slice(0, maxLimit);

    return res.status(200).json({
      success: true,
      forecasts,
      count: forecasts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Climate Forecast API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch climate forecast' });
  }
}
