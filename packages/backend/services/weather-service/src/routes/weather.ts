/**
 * Weather Routes
 * GET /api/weather/forecast - Get weather forecast
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { 
  ForecastRequestSchema,
  ForecastResponseSchema,
  WeatherForecast,
} from '@kilimopro/shared-types';
import { weatherConnector } from '../connectors/weather.js';
import { createValidationError } from '@kilimopro/shared-types';

const logger = getLogger('weather-routes');
const cache = getCacheClient('weather-routes');

export async function weatherRoutes(app: FastifyInstance, options: FastifyPluginOptions) {
  // Get weather forecast
  app.get('/forecast', {
    schema: {
      querystring: ForecastRequestSchema,
      response: {
        200: ForecastResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const query = request.query as unknown as { lat: string; lon: string; days?: string };
      
      // Validate coordinates
      const lat = parseFloat(query.lat);
      const lon = parseFloat(query.lon);
      
      if (isNaN(lat) || isNaN(lon)) {
        throw createValidationError('Invalid coordinates', [
          { path: ['lat'], message: 'Latitude must be a valid number', code: 'invalid_type' },
          { path: ['lon'], message: 'Longitude must be a valid number', code: 'invalid_type' },
        ]);
      }
      
      // Validate coordinate ranges
      if (lat < -90 || lat > 90) {
        throw createValidationError('Invalid latitude', [
          { path: ['lat'], message: 'Latitude must be between -90 and 90', code: 'invalid_range' },
        ]);
      }
      
      if (lon < -180 || lon > 180) {
        throw createValidationError('Invalid longitude', [
          { path: ['lon'], message: 'Longitude must be between -180 and 180', code: 'invalid_range' },
        ]);
      }
      
      const days = parseInt(query.days || '7');
      
      if (isNaN(days) || days < 1 || days > 14) {
        throw createValidationError('Invalid days', [
          { path: ['days'], message: 'Days must be between 1 and 14', code: 'invalid_range' },
        ]);
      }
      
      const forecastRequest = {
        location: { lat, lon },
        days,
      };
      
      const forecasts = await weatherConnector.getForecast(forecastRequest);
      
      logger.info('Forecast retrieved', {
        location: { lat, lon },
        days,
        count: forecasts.length,
      });
      
      return {
        forecasts,
        location: { lat, lon },
        source: forecasts[0]?.source || 'unknown',
      };
    } catch (error) {
      logger.error('Forecast request failed', { error: error as Error });
      throw error;
    }
  });
}
