/**
 * User Routes
 * Proxy to user service
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { createProxyRoute, createCacheKey } from '../utils/proxy.js';
import { config } from '../config/index.js';
import { authenticate } from '../middleware/authenticate.js';

export async function userRoutes(app: FastifyInstance, options: FastifyPluginOptions) {
  // Proxy all user routes to user service
  const userProxy = createProxyRoute({
    service: 'user',
    path: '/api/users',
    cacheTtl: config.cacheTtl.user,
    cacheKey: createCacheKey('user'),
  });

  // Profile
  app.get('/me', { preHandler: authenticate }, userProxy);
  app.put('/me', { preHandler: authenticate }, userProxy);
  
  // Users (admin only)
  app.get('/', { preHandler: authenticate }, userProxy);
  app.get('/:id', { preHandler: authenticate }, userProxy);
  app.post('/', { preHandler: authenticate }, userProxy);
  app.put('/:id', { preHandler: authenticate }, userProxy);
  app.delete('/:id', { preHandler: authenticate }, userProxy);
}
