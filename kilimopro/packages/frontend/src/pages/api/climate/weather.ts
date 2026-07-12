/**
 * KilimoPRO 2.0 — Weather API (Open-Meteo — free, no API key!)
 * GET /api/climate/weather?latitude=-1.29&longitude=36.82&days=7
 * GET /api/climate/weather?country=KE&days=7
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { DataAggregator } from '@/lib/data/aggregator';
import { getCountryCoordinates } from '@/lib/data/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { latitude, longitude, country, days } = req.query;

  try {
    let lat = parseFloat(latitude as string);
    let lon = parseFloat(longitude as string);

    // Get coordinates from country code if lat/lon not provided
    if (country && (!lat || !lon)) {
      const coords = getCountryCoordinates(country as string);
      lat = coords[0];
      lon = coords[1];
    }

    // Default to Nairobi
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
      lat = -1.2921;
      lon = 36.8219;
    }

    const forecastDays = Math.min(parseInt((days as string) || '7', 10), 16);
    const weather = await DataAggregator.getWeather(lat, lon, forecastDays);
    const alerts = await DataAggregator.getWeatherAlerts(lat, lon);

    return res.status(200).json({
      success: true,
      ...weather,
      alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weather API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch weather data' });
  }
}
