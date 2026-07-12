/**
 * KilimoPRO 2.0 — Production Data API (FAOSTAT)
 * GET /api/production?country=KE&crop=maize&year=2024
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { DataAggregator } from '@/lib/data/aggregator';
import { IGAD } from '@/lib/data/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { country, crop, limit } = req.query;

  try {
    let data;
    if (country && typeof country === 'string') {
      data = await DataAggregator.getProduction(country.toUpperCase(), crop as string);
    } else if (crop) {
      const countries = Object.keys(IGAD.COUNTRIES);
      const results = await Promise.all(countries.map(c => DataAggregator.getProduction(c, crop as string)));
      data = results.flat();
    } else {
      data = await DataAggregator.getProduction();
    }

    const maxLimit = parseInt((limit as string) || '50', 10);
    if (Array.isArray(data)) data = data.slice(0, maxLimit);

    return res.status(200).json({
      success: true,
      data,
      count: Array.isArray(data) ? data.length : 1,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Production API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch production data' });
  }
}
