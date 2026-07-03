/**
 * Market Routes
 * Proxy to market service
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { createProxyRoute, createCacheKey } from '../utils/proxy.js';
import { config } from '../config/index.js';

export async function marketRoutes(app: FastifyInstance, options: FastifyPluginOptions) {
  // Proxy all market routes to market service
  const marketProxy = createProxyRoute({
    service: 'market',
    path: '/api/market',
    cacheTtl: config.cacheTtl.default,
    cacheKey: createCacheKey('market'),
  });

  // Prices
  app.get('/prices', marketProxy);
  
  // Trend
  app.get('/trend', marketProxy);
  
  // Forecast
  app.get('/forecast', marketProxy);
  
  // Markets
  app.get('/markets', marketProxy);
}
