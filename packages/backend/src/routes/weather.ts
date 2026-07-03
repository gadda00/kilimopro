/**
 * Weather Routes
 * GET /api/weather/forecast?lat=X&lon=Y
 * GET /api/weather/alerts?lat=X&lon=Y
 * GET /api/weather/ndvi?lat=X&lon=Y
 * GET /api/weather/rainfall?lat=X&lon=Y&days=30
 */

import { FastifyInstance } from 'fastify';
import { weather } from '../connectors/weather.js';

export async function weatherRoutes(app: FastifyInstance) {
  // 7-day forecast
  app.get('/forecast', async (request) => {
    const { lat, lon } = request.query as { lat: string; lon: string };
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return { error: 'Invalid coordinates' };
    }
    
    const forecast = await weather.getForecast(latitude, longitude);
    return { forecast, source: forecast[0]?.source || 'unknown' };
  });

  // Weather alerts
  app.get('/alerts', async (request) => {
    const { lat, lon, crops } = request.query as { lat: string; lon: string; crops?: string };
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const cropList = crops?.split(',').filter(Boolean) || [];
    
    const alerts = await weather.getAlerts(latitude, longitude, cropList);
    return { alerts, count: alerts.length };
  });

  // NDVI (crop health from satellite)
  app.get('/ndvi', async (request) => {
    const { lat, lon } = request.query as { lat: string; lon: string };
    const ndvi = await weather.getNDVI(parseFloat(lat), parseFloat(lon));
    return ndvi;
  });

  // Historical rainfall (CHIRPS)
  app.get('/rainfall', async (request) => {
    const { lat, lon, days } = request.query as { lat: string; lon: string; days?: string };
    const rainfall = await weather.getCHIRPSRainfall(
      parseFloat(lat),
      parseFloat(lon),
      parseInt(days || '30')
    );
    return { rainfall, total: rainfall.reduce((a, b) => a + b, 0), days: rainfall.length };
  });
}
