/**
 * KilimoPRO 2.0 — World Bank Indicators API
 * GET /api/indicators?country=KE
 * GET /api/indicators?country=KE&indicator=AG.LND.AGRI.ZS
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { DataAggregator } from '@/lib/data/aggregator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { country, indicator, year } = req.query;

  if (!country) {
    return res.status(400).json({ success: false, error: 'Country parameter is required' });
  }

  try {
    let indicators = await DataAggregator.getAgricultureIndicators(country as string);

    if (indicator) {
      indicators = indicators.filter(i => i.indicatorCode === indicator);
    }
    if (year) {
      indicators = indicators.filter(i => i.year === parseInt(year as string, 10));
    }

    return res.status(200).json({
      success: true,
      data: indicators,
      count: indicators.length,
      country: (country as string).toUpperCase(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Indicators API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch indicators' });
  }
}
