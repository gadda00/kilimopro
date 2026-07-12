/**
 * KilimoPRO 2.0 — Market Prices API
 * GET /api/prices?country=KE&crop=maize&format=json|csv|sms
 *
 * Free, no API key required. Data from FAOSTAT.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { DataAggregator } from '@/lib/data/aggregator';
import { IGAD } from '@/lib/data/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { country, crop, year, limit, format } = req.query;

  try {
    let data;
    if (country && typeof country === 'string') {
      data = await DataAggregator.getMarketPrices(country.toUpperCase(), crop as string);
    } else if (crop) {
      const countries = Object.keys(IGAD.COUNTRIES);
      const results = await Promise.all(countries.map(c => DataAggregator.getMarketPrices(c, crop as string)));
      data = results.flat();
    } else {
      data = await DataAggregator.getMarketPrices();
    }

    // Apply limit
    const maxLimit = parseInt((limit as string) || '50', 10);
    if (Array.isArray(data)) data = data.slice(0, maxLimit);

    // Format response
    switch (format) {
      case 'csv':
        const csv = DataAggregator.formatPricesAsCSV(data as any[]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="market_prices.csv"');
        return res.status(200).send(csv);

      case 'sms':
        const sms = DataAggregator.formatPricesAsSMS(data as any[]);
        return res.status(200).json({ success: true, message: sms });

      default:
        return res.status(200).json({
          success: true,
          data,
          count: Array.isArray(data) ? data.length : 1,
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('Market Prices API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch market prices' });
  }
}
