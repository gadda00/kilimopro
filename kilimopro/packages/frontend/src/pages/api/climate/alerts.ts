/**
 * KilimoPRO 2.0 — Climate Alerts API
 * GET /api/climate/alerts?country=KE&type=drought&severity=high
 *
 * Free, no API key required. Data from ICPAC.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { DataAggregator } from '@/lib/data/aggregator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { country, type, severity, active, limit } = req.query;

  try {
    let alerts = await DataAggregator.getHazardAlerts(country as string);

    // Filter by type
    if (type) alerts = alerts.filter(a => a.type === type);

    // Filter by severity
    if (severity) alerts = alerts.filter(a => a.severity === severity);

    // Filter by active status
    if (active !== 'false') {
      alerts = alerts.filter(a => {
        if (!a.endDate) return true;
        return new Date(a.endDate) >= new Date();
      });
    }

    // Apply limit
    const maxLimit = parseInt((limit as string) || '20', 10);
    alerts = alerts.slice(0, maxLimit);

    return res.status(200).json({
      success: true,
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Climate Alerts API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch climate alerts' });
  }
}
