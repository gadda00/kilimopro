/**
 * KilimoPRO 2.0 — Agriculture Watch API (ICPAC)
 * GET /api/climate/watch?summary=true
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { DataAggregator } from '@/lib/data/aggregator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { summary } = req.query;

  try {
    const watch = await DataAggregator.getAgricultureWatch();

    if (summary === 'true') {
      return res.status(200).json({
        success: true,
        summary: watch.summary,
        lastUpdated: watch.date,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      ...watch,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Agriculture Watch API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch agriculture watch' });
  }
}
