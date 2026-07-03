/**
 * Farm Routes
 * Manages farm CRUD operations
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getDatabaseClient } from '@kilimopro/db-client';
import { getCacheClient } from '@kilimopro/cache-client';
import { createSuccessResponse, createErrorResponse, ErrorType } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('farm-service:farms');
const db = getDatabaseClient('farm-service');
const cache = getCacheClient('farm-service');

// Schemas
const FarmSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevation: z.number().min(0).max(10000).optional(),
  soilType: z.string().min(1).max(50).optional(),
  soilPH: z.number().min(0).max(14).optional(),
  agroEcologicalZone: z.string().min(1).max(50).optional(),
  irrigationType: z.string().min(1).max(50).optional(),
  sizeHectares: z.number().min(0).max(10000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const CreateFarmSchema = z.object({
  name: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevation: z.number().min(0).max(10000).optional(),
  soilType: z.string().min(1).max(50).optional(),
  soilPH: z.number().min(0).max(14).optional(),
  agroEcologicalZone: z.string().min(1).max(50).optional(),
  irrigationType: z.string().min(1).max(50).optional(),
  sizeHectares: z.number().min(0).max(10000).optional(),
});

const UpdateFarmSchema = CreateFarmSchema.partial();

export const farmRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all farms for authenticated user
  fastify.get('/', {
    schema: {
      querystring: z.object({
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
                farms: { type: 'array', items: FarmSchema },
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
      const { page, limit } = request.query as { page: number; limit: number };
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

      // Generate cache key
      const cacheKey = `farm:user:${user.id}:${page}:${limit}`;
      
      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for user farms', { cacheKey });
        return JSON.parse(cached);
      }

      try {
        // Query farms for this user
        const [farms, total] = await Promise.all([
          db.prisma.farm.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.prisma.farm.count({ where: { userId: user.id } }),
        ]);

        const totalPages = Math.ceil(total / limit);

        const response = createSuccessResponse({
          data: {
            farms: farms.map(farm => ({
              id: farm.id,
              userId: farm.userId,
              name: farm.name,
              latitude: farm.latitude,
              longitude: farm.longitude,
              elevation: farm.elevation || undefined,
              soilType: farm.soilType || undefined,
              soilPH: farm.soilPH || undefined,
              agroEcologicalZone: farm.agroEcologicalZone || undefined,
              irrigationType: farm.irrigationType || undefined,
              sizeHectares: farm.sizeHectares || undefined,
              createdAt: farm.createdAt.toISOString(),
              updatedAt: farm.updatedAt.toISOString(),
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

        // Cache the response
        await cache.set(cacheKey, JSON.stringify(response), config.cache.ttl.farms);
        
        return response;
      } catch (error) {
        logger.error('Failed to get user farms', {
          error: error as Error,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve farms',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Create new farm
  fastify.post('/', {
    schema: {
      body: CreateFarmSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                farm: FarmSchema,
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
        400: {
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

      const { name, latitude, longitude, elevation, soilType, soilPH, agroEcologicalZone, irrigationType, sizeHectares } = request.body;

      try {
        // Check if user already has a farm (for now, limit to 1 farm per user)
        const existingFarm = await db.prisma.farm.findFirst({ where: { userId: user.id } });
        
        if (existingFarm) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.VALIDATION_ERROR,
            message: 'User can only have one farm. Update your existing farm instead.',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(400).send(errorResponse);
        }

        // Create new farm
        const farm = await db.prisma.farm.create({
          data: {
            userId: user.id,
            name,
            latitude,
            longitude,
            elevation,
            soilType,
            soilPH,
            agroEcologicalZone,
            irrigationType,
            sizeHectares,
          },
        });

        // Invalidate cache
        await cache.delete(`farm:user:${user.id}:*`);

        logger.info('New farm created', {
          farmId: farm.id,
          userId: user.id,
          name,
          location: `${latitude},${longitude}`,
        });

        return reply.status(201).send(createSuccessResponse({
          data: {
            farm: {
              id: farm.id,
              userId: farm.userId,
              name: farm.name,
              latitude: farm.latitude,
              longitude: farm.longitude,
              elevation: farm.elevation || undefined,
              soilType: farm.soilType || undefined,
              soilPH: farm.soilPH || undefined,
              agroEcologicalZone: farm.agroEcologicalZone || undefined,
              irrigationType: farm.irrigationType || undefined,
              sizeHectares: farm.sizeHectares || undefined,
              createdAt: farm.createdAt.toISOString(),
              updatedAt: farm.updatedAt.toISOString(),
            },
            message: 'Farm created successfully',
          },
          requestId: request.id,
        }));
      } catch (error) {
        logger.error('Failed to create farm', {
          error: error as Error,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to create farm',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Get specific farm by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                farm: FarmSchema,
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
      const { id } = request.params as { id: string };
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
        // Get farm
        const farm = await db.prisma.farm.findUnique({ where: { id } });
        
        if (!farm) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Farm not found',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        // Check if user owns this farm
        if (farm.userId !== user.id && user.role !== 'admin') {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.FORBIDDEN,
            message: 'You can only access your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        return createSuccessResponse({
          data: {
            farm: {
              id: farm.id,
              userId: farm.userId,
              name: farm.name,
              latitude: farm.latitude,
              longitude: farm.longitude,
              elevation: farm.elevation || undefined,
              soilType: farm.soilType || undefined,
              soilPH: farm.soilPH || undefined,
              agroEcologicalZone: farm.agroEcologicalZone || undefined,
              irrigationType: farm.irrigationType || undefined,
              sizeHectares: farm.sizeHectares || undefined,
              createdAt: farm.createdAt.toISOString(),
              updatedAt: farm.updatedAt.toISOString(),
            },
          },
          requestId: request.id,
        });
      } catch (error) {
        logger.error('Failed to get farm', {
          error: error as Error,
          farmId: id,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve farm',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Update farm
  fastify.put('/:id', {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      body: UpdateFarmSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                farm: FarmSchema,
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
      const { id } = request.params as { id: string };
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

      const updateData = request.body;

      try {
        // Get farm
        const farm = await db.prisma.farm.findUnique({ where: { id } });
        
        if (!farm) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Farm not found',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        // Check if user owns this farm
        if (farm.userId !== user.id && user.role !== 'admin') {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.FORBIDDEN,
            message: 'You can only update your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        // Update farm
        const updatedFarm = await db.prisma.farm.update({
          where: { id },
          data: updateData,
        });

        // Invalidate cache
        await cache.delete(`farm:user:${user.id}:*`);
        await cache.delete(`farm:${id}`);

        logger.info('Farm updated', {
          farmId: id,
          userId: user.id,
          updates: Object.keys(updateData),
        });

        return createSuccessResponse({
          data: {
            farm: {
              id: updatedFarm.id,
              userId: updatedFarm.userId,
              name: updatedFarm.name,
              latitude: updatedFarm.latitude,
              longitude: updatedFarm.longitude,
              elevation: updatedFarm.elevation || undefined,
              soilType: updatedFarm.soilType || undefined,
              soilPH: updatedFarm.soilPH || undefined,
              agroEcologicalZone: updatedFarm.agroEcologicalZone || undefined,
              irrigationType: updatedFarm.irrigationType || undefined,
              sizeHectares: updatedFarm.sizeHectares || undefined,
              createdAt: updatedFarm.createdAt.toISOString(),
              updatedAt: updatedFarm.updatedAt.toISOString(),
            },
            message: 'Farm updated successfully',
          },
          requestId: request.id,
        });
      } catch (error) {
        logger.error('Failed to update farm', {
          error: error as Error,
          farmId: id,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to update farm',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Delete farm
  fastify.delete('/:id', {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                farmId: { type: 'string' },
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
      const { id } = request.params as { id: string };
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
        // Get farm
        const farm = await db.prisma.farm.findUnique({ where: { id } });
        
        if (!farm) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Farm not found',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        // Check if user owns this farm
        if (farm.userId !== user.id && user.role !== 'admin') {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.FORBIDDEN,
            message: 'You can only delete your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        // Delete farm (and all related plots and observations)
        await db.prisma.farm.delete({
          where: { id },
        });

        // Invalidate cache
        await cache.delete(`farm:user:${user.id}:*`);
        await cache.delete(`farm:${id}`);

        logger.info('Farm deleted', {
          farmId: id,
          userId: user.id,
        });

        return createSuccessResponse({
          data: {
            message: 'Farm deleted successfully',
            farmId: id,
          },
          requestId: request.id,
        });
      } catch (error) {
        logger.error('Failed to delete farm', {
          error: error as Error,
          farmId: id,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to delete farm',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });
};
