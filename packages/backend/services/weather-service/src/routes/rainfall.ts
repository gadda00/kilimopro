/**
 * Rainfall Routes
 * GET /api/weather/rainfall - Get historical rainfall data
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getLogger } from '@kilimopro/logger';
import { 
  RainfallRequestSchema,
  RainfallResponseSchema,
  Rainfall,
} from '@kilimopro/shared-types';
import { weatherConnector } from '../connectors/weather.js';
import { createValidationError } from '@kilimopro/shared-types';

const logger = getLogger('rainfall-routes');

export async function rainfallRoutes(app: FastifyInstance, options: FastifyPluginOptions) {
  // Get rainfall data
  app.get('/rainfall', {
    schema: {
      querystring: RainfallRequestSchema,
      response: {
        200: RainfallResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const query = request.query as unknown as { 
        lat: string; 
        lon: string; 
        days?: string;
        source?: string;
      };
      
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
      
      const days = parseInt(query.days || '30');
      
      if (isNaN(days) || days < 1 || days > 365) {
        throw createValidationError('Invalid days', [
          { path: ['days'], message: 'Days must be between 1 and 365', code: 'invalid_range' },
        ]);
      }
      
      const rainfallRequest = {
        location: { lat, lon },
        days,
      };
      
      const rainfall = await weatherConnector.getRainfall(rainfallRequest);
      
      const total = rainfall.reduce((sum, day) => sum + day.rainfall, 0);
      const average = rainfall.length > 0 ? total / rainfall.length : 0;
      
      logger.info('Rainfall retrieved', {
        location: { lat, lon },
        days,
        total,
        average,
      });
      
      return {
        rainfall,
        total: Math.round(total * 10) / 10,
        average: Math.round(average * 10) / 10,
        location: { lat, lon },
        days,
      };
    } catch (error) {
      logger.error('Rainfall request failed', { error: error as Error });
      throw error;
    }
  });
}
