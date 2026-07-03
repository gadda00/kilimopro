/**
 * Farm Routes
 * Proxy routes to Farm Service
 */

import { FastifyPluginAsync } from 'fastify';
import { getLogger } from '@kilimopro/logger';
import { config } from '../config/index.js';

const logger = getLogger('api-gateway:farm');

export const farmRoutes: FastifyPluginAsync = async (fastify) => {
  const farmServiceUrl = config.services.farm;

  // Proxy to farm service
  const proxyToFarm = async (request: any, reply: any, path: string) => {
    try {
      const url = new URL(path, farmServiceUrl);
      
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
      logger.error('Failed to proxy to farm service', {
        error: error as Error,
        path,
        method: request.method,
      });
      
      return reply.status(502).send({
        success: false,
        error: {
          type: 'PROXY_ERROR',
          message: 'Failed to connect to farm service',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };

  // Farm routes
  fastify.get('/', async (request, reply) => {
    return proxyToFarm(request, reply, '/api/farm');
  });

  fastify.post('/', async (request, reply) => {
    return proxyToFarm(request, reply, '/api/farm');
  });

  fastify.get('/:id', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).id}`);
  });

  fastify.put('/:id', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).id}`);
  });

  fastify.delete('/:id', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).id}`);
  });

  // Plot routes
  fastify.get('/:farmId/plots', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).farmId}/plots`);
  });

  fastify.post('/:farmId/plots', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).farmId}/plots`);
  });

  fastify.get('/:farmId/plots/:plotId', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).farmId}/plots/${(request.params as any).plotId}`);
  });

  fastify.put('/:farmId/plots/:plotId', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).farmId}/plots/${(request.params as any).plotId}`);
  });

  fastify.delete('/:farmId/plots/:plotId', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).farmId}/plots/${(request.params as any).plotId}`);
  });

  // Observation routes
  fastify.get('/:farmId/observations', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).farmId}/observations`);
  });

  fastify.post('/:farmId/observations', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).farmId}/observations`);
  });

  fastify.get('/:farmId/observations/:observationId', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).farmId}/observations/${(request.params as any).observationId}`);
  });

  // Analytics routes
  fastify.get('/:farmId/analytics', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).farmId}/analytics`);
  });

  fastify.get('/:farmId/reports', async (request, reply) => {
    return proxyToFarm(request, reply, `/api/farm/${(request.params as any).farmId}/reports`);
  });
};
