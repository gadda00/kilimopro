/**
 * NDVI Routes
 * GET /api/weather/ndvi - Get NDVI (crop health) data
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getLogger } from '@kilimopro/logger';
import { 
  NDVIRequestSchema,
  NDVIResponseSchema,
  NDVI,
} from '@kilimopro/shared-types';
import { weatherConnector } from '../connectors/weather.js';
import { createValidationError } from '@kilimopro/shared-types';

const logger = getLogger('ndvi-routes');

export async function ndviRoutes(app: FastifyInstance, options: FastifyPluginOptions) {
  // Get NDVI data
  app.get('/ndvi', {
    schema: {
      querystring: NDVIRequestSchema,
      response: {
        200: NDVIResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const query = request.query as unknown as { 
        lat: string; 
        lon: string; 
        startDate?: string;
        endDate?: string;
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
      
      const ndviRequest = {
        location: { lat, lon },
        startDate: query.startDate,
        endDate: query.endDate,
      };
      
      const ndvi = await weatherConnector.getNDVI(ndviRequest);
      
      logger.info('NDVI retrieved', {
        location: { lat, lon },
        ndvi: ndvi.current,
        trend: ndvi.trend,
      });
      
      return {
        ndvi,
        location: { lat, lon },
      };
    } catch (error) {
      logger.error('NDVI request failed', { error: error as Error });
      throw error;
    }
  });
}
