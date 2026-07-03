/**
 * Disease Routes
 * Proxy routes to Disease Service
 */

import { FastifyPluginAsync } from 'fastify';
import { getLogger } from '@kilimopro/logger';
import { config } from '../config/index.js';

const logger = getLogger('api-gateway:disease');

export const diseaseRoutes: FastifyPluginAsync = async (fastify) => {
  const diseaseServiceUrl = config.services.disease;

  // Proxy to disease service
  const proxyToDisease = async (request: any, reply: any, path: string) => {
    try {
      const url = new URL(path, diseaseServiceUrl);
      
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
      logger.error('Failed to proxy to disease service', {
        error: error as Error,
        path,
        method: request.method,
      });
      
      return reply.status(502).send({
        success: false,
        error: {
          type: 'PROXY_ERROR',
          message: 'Failed to connect to disease service',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  // Detection routes
  fastify.post('/detect', async (request, reply) => {
    return proxyToDisease(request, reply, '/api/disease/detect');
  });

  fastify.get('/detect/:id', async (request, reply) => {
    return proxyToDisease(request, reply, `/api/disease/detect/${(request.params as any).id}`);
  });

  // Model routes
  fastify.get('/models', async (request, reply) => {
    return proxyToDisease(request, reply, '/api/disease/models');
  });

  fastify.get('/models/:id', async (request, reply) => {
    return proxyToDisease(request, reply, `/api/disease/models/${(request.params as any).id}`);
  });

  // History routes
  fastify.get('/history', async (request, reply) => {
    return proxyToDisease(request, reply, '/api/disease/history');
  });

  fastify.get('/history/:userId', async (request, reply) => {
    return proxyToDisease(request, reply, `/api/disease/history/${(request.params as any).userId}`);
  });

  // Alerts routes
  fastify.get('/alerts', async (request, reply) => {
    return proxyToDisease(request, reply, '/api/disease/alerts');
  });

  fastify.post('/alerts', async (request, reply) => {
    return proxyToDisease(request, reply, '/api/disease/alerts');
  });
};
