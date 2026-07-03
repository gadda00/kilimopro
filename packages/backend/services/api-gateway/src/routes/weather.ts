/**
 * Weather Routes
 * Proxy to weather service
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { createProxyRoute, createCacheKey } from '../utils/proxy.js';
import { config } from '../config/index.js';

export async function weatherRoutes(app: FastifyInstance, options: FastifyPluginOptions) {
  // Proxy all weather routes to weather service
  const weatherProxy = createProxyRoute({
    service: 'weather',
    path: '/api/weather',
    cacheTtl: config.cacheTtl.default,
    cacheKey: createCacheKey('weather'),
  });

  // Forecast
  app.get('/forecast', weatherProxy);
  
  // Alerts
  app.get('/alerts', weatherProxy);
  
  // NDVI
  app.get('/ndvi', weatherProxy);
  
  // Rainfall
  app.get('/rainfall', weatherProxy);
}
