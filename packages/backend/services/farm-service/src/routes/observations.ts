/**
 * Observation Routes
 * Manages field observations for plots
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getDatabaseClient } from '@kilimopro/db-client';
import { getCacheClient } from '@kilimopro/cache-client';
import { createSuccessResponse, createErrorResponse, ErrorType } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('farm-service:observations');
const db = getDatabaseClient('farm-service');
const cache = getCacheClient('farm-service');

// Schemas
const ObservationSchema = z.object({
  id: z.string(),
  plotId: z.string(),
  type: z.string().min(1).max(50),
  value: z.string().min(1).max(500),
  imageUrl: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  createdAt: z.string().datetime(),
});

const CreateObservationSchema = z.object({
  type: z.string().min(1).max(50),
  value: z.string().min(1).max(500),
  imageUrl: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const ObservationTypeSchema = z.enum([
  'pest', 'disease', 'weed', 'soil', 'water', 'growth', 'harvest', 'weather', 'other'
]);

export const observationRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all observations for a plot
  fastify.get('/:farmId/observations', {
    schema: {
      params: z.object({
        farmId: z.string(),
      }),
      querystring: z.object({
        plotId: z.string().optional(),
        type: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                observations: { type: 'array', items: ObservationSchema },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'number' },
                    limit: { type: 'number' },
                    total: { type: 'number' },
                    totalPages: { type: 'number' },
                  },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                message: { type: 'string' },
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                message: { type: 'string' },
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { farmId } = request.params as { farmId: string };
      const { plotId, type, startDate, endDate, page, limit } = request.query as {
        plotId?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
        page: number;
        limit: number;
      };
      const user = (request as any).user;
      
      if (!user) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.UNAUTHORIZED,
          message: 'Authentication required',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(401).send(errorResponse);
      }

      try {
        // Check if farm exists and user owns it
        const farm = await db.prisma.farm.findUnique({ where: { id: farmId } });
        
        if (!farm) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Farm not found',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        if (farm.userId !== user.id && user.role !== 'admin') {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.FORBIDDEN,
            message: 'You can only access observations in your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        // Build query
        const where: Record<string, any> = {};
        
        if (plotId) {
          where.plotId = plotId;
        } else {
          // Get all plots for this farm
          const plots = await db.prisma.plot.findMany({ where: { farmId } });
          where.plotId = { in: plots.map(p => p.id) };
        }
        
        if (type) {
          where.type = { contains: type, mode: 'insensitive' };
        }
        
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) {
            where.createdAt.gte = new Date(startDate);
          }
          if (endDate) {
            where.createdAt.lte = new Date(endDate);
          }
        }

        // Query observations
        const [observations, total] = await Promise.all([
          db.prisma.observation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.prisma.observation.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return createSuccessResponse({
          data: {
            observations: observations.map(obs => ({
              id: obs.id,
              plotId: obs.plotId,
              type: obs.type,
              value: obs.value,
              imageUrl: obs.imageUrl || undefined,
              latitude: obs.latitude || undefined,
              longitude: obs.longitude || undefined,
              createdAt: obs.createdAt.toISOString(),
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages,
            },
          },
          requestId: request.id,
        });
      } catch (error) {
        logger.error('Failed to get observations', {
          error: error as Error,
          farmId,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve observations',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Create new observation
  fastify.post('/:farmId/observations', {
    schema: {
      params: z.object({
        farmId: z.string(),
      }),
      body: CreateObservationSchema.extend({
        plotId: z.string().optional(),
      }),
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                observation: ObservationSchema,
                message: { type: 'string' },
              },
            },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                message: { type: 'string' },
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                message: { type: 'string' },
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { farmId } = request.params as { farmId: string };
      const { plotId, type, value, imageUrl, latitude, longitude } = request.body;
      const user = (request as any).user;
      
      if (!user) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.UNAUTHORIZED,
          message: 'Authentication required',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(401).send(errorResponse);
      }

      try {
        // Check if farm exists and user owns it
        const farm = await db.prisma.farm.findUnique({ where: { id: farmId } });
        
        if (!farm) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Farm not found',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        if (farm.userId !== user.id && user.role !== 'admin') {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.FORBIDDEN,
            message: 'You can only create observations in your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        // If no plotId provided, use the first plot in the farm
        let targetPlotId = plotId;
        if (!targetPlotId) {
          const plots = await db.prisma.plot.findMany({ where: { farmId } });
          if (plots.length === 0) {
            const errorResponse = createErrorResponse({
              errorType: ErrorType.VALIDATION_ERROR,
              message: 'No plots found in this farm. Create a plot first or specify a plotId.',
              requestId: request.id,
              timestamp: new Date().toISOString(),
            });
            return reply.status(400).send(errorResponse);
          }
          targetPlotId = plots[0].id;
        }

        // Verify plot belongs to this farm
        const plot = await db.prisma.plot.findUnique({ where: { id: targetPlotId } });
        if (!plot || plot.farmId !== farmId) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Plot not found in this farm',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        // Create new observation
        const observation = await db.prisma.observation.create({
          data: {
            plotId: targetPlotId,
            type,
            value,
            imageUrl,
            latitude,
            longitude,
          },
        });

        // Invalidate cache
        await cache.delete(`farm:${farmId}:observations:*`);

        logger.info('New observation created', {
          observationId: observation.id,
          plotId: targetPlotId,
          farmId,
          userId: user.id,
          type,
        });

        return reply.status(201).send(createSuccessResponse({
          data: {
            observation: {
              id: observation.id,
              plotId: observation.plotId,
              type: observation.type,
              value: observation.value,
              imageUrl: observation.imageUrl || undefined,
              latitude: observation.latitude || undefined,
              longitude: observation.longitude || undefined,
              createdAt: observation.createdAt.toISOString(),
            },
            message: 'Observation created successfully',
          },
          requestId: request.id,
        }));
      } catch (error) {
        logger.error('Failed to create observation', {
          error: error as Error,
          farmId,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to create observation',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Get specific observation by ID
  fastify.get('/:farmId/observations/:observationId', {
    schema: {
      params: z.object({
        farmId: z.string(),
        observationId: z.string(),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                observation: ObservationSchema,
              },
            },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                message: { type: 'string' },
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                message: { type: 'string' },
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { farmId, observationId } = request.params as { farmId: string; observationId: string };
      const user = (request as any).user;
      
      if (!user) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.UNAUTHORIZED,
          message: 'Authentication required',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(401).send(errorResponse);
      }

      try {
        // Get observation
        const observation = await db.prisma.observation.findUnique({ where: { id: observationId } });
        
        if (!observation) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Observation not found',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        // Check if user owns the farm
        const plot = await db.prisma.plot.findUnique({ where: { id: observation.plotId } });
        if (!plot) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Plot not found',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        const farm = await db.prisma.farm.findUnique({ where: { id: plot.farmId } });
        if (!farm || (farm.userId !== user.id && user.role !== 'admin')) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.FORBIDDEN,
            message: 'You can only access observations in your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        return createSuccessResponse({
          data: {
            observation: {
              id: observation.id,
              plotId: observation.plotId,
              type: observation.type,
              value: observation.value,
              imageUrl: observation.imageUrl || undefined,
              latitude: observation.latitude || undefined,
              longitude: observation.longitude || undefined,
              createdAt: observation.createdAt.toISOString(),
            },
          },
          requestId: request.id,
        });
      } catch (error) {
        logger.error('Failed to get observation', {
          error: error as Error,
          observationId,
          farmId,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve observation',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });
};
