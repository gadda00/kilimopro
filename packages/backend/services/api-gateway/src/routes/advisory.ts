/**
 * Advisory Routes
 * Proxy routes to Advisory Service
 */

import { FastifyPluginAsync } from 'fastify';
import { getLogger } from '@kilimopro/logger';
import { config } from '../config/index.js';

const logger = getLogger('api-gateway:advisory');

export const advisoryRoutes: FastifyPluginAsync = async (fastify) => {
  const advisoryServiceUrl = config.services.advisory;

  // Proxy to advisory service
  const proxyToAdvisory = async (request: any, reply: any, path: string) => {
    try {
      const url = new URL(path, advisoryServiceUrl);
      
      // Forward headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': request.headers.authorization || '',
        'X-Request-Id': request.id,
      };

      // Forward query parameters
      const queryParams = new URLSearchParams(request.query as Record<string, string>);
      url.search = queryParams.toString();

      const response = await fetch(url.toString(), {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? JSON.stringify(request.body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return reply.status(response.status).send(errorData);
      }

      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      logger.error('Failed to proxy to advisory service', {
        error: error as Error,
        path,
        method: request.method,
      });
      
      return reply.status(502).send({
        success: false,
        error: {
          type: 'PROXY_ERROR',
          message: 'Failed to connect to advisory service',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  // Content routes
  fastify.get('/content', async (request, reply) => {
    return proxyToAdvisory(request, reply, '/api/advisory/content');
  });

  fastify.get('/content/:id', async (request, reply) => {
    return proxyToAdvisory(request, reply, `/api/advisory/content/${(request.params as any).id}`);
  });

  fastify.get('/content/categories', async (request, reply) => {
    return proxyToAdvisory(request, reply, '/api/advisory/content/categories');
  });

  // Recommendations routes
  fastify.post('/recommendations', async (request, reply) => {
    return proxyToAdvisory(request, reply, '/api/advisory/recommendations');
  });

  // Council routes
  fastify.get('/council/personas', async (request, reply) => {
    return proxyToAdvisory(request, reply, '/api/advisory/council/personas');
  });

  fastify.post('/council', async (request, reply) => {
    return proxyToAdvisory(request, reply, '/api/advisory/council');
  });

  fastify.get('/council/history', async (request, reply) => {
    return proxyToAdvisory(request, reply, '/api/advisory/council/history');
  });
};
