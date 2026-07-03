/**
 * Weather Alerts Routes
 * GET /api/weather/alerts - Get weather alerts
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getLogger } from '@kilimopro/logger';
import { 
  AlertsRequestSchema,
  AlertsResponseSchema,
  WeatherAlert,
} from '@kilimopro/shared-types';
import { weatherConnector } from '../connectors/weather.js';
import { createValidationError } from '@kilimopro/shared-types';

const logger = getLogger('alerts-routes');

export async function alertRoutes(app: FastifyInstance, options: FastifyPluginOptions) {
  // Get weather alerts
  app.get('/alerts', {
    schema: {
      querystring: AlertsRequestSchema,
      response: {
        200: AlertsResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const query = request.query as unknown as { 
        lat: string; 
        lon: string; 
        crops?: string; 
        days?: string; 
        severity?: string;
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
      
      const crops = query.crops?.split(',').filter(Boolean) || [];
      const days = parseInt(query.days || '7');
      
      if (isNaN(days) || days < 1 || days > 30) {
        throw createValidationError('Invalid days', [
          { path: ['days'], message: 'Days must be between 1 and 30', code: 'invalid_range' },
        ]);
      }
      
      const alertsRequest = {
        location: { lat, lon },
        crops,
        days,
      };
      
      const alerts = await weatherConnector.getAlerts(alertsRequest);
      
      logger.info('Alerts retrieved', {
        location: { lat, lon },
        crops,
        days,
        count: alerts.length,
      });
      
      return {
        alerts,
        count: alerts.length,
        location: { lat, lon },
      };
    } catch (error) {
      logger.error('Alerts request failed', { error: error as Error });
      throw error;
    }
  });
}
