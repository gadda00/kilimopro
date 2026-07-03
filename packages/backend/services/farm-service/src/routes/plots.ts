/**
 * Plot Routes
 * Manages plot CRUD operations within farms
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getDatabaseClient } from '@kilimopro/db-client';
import { getCacheClient } from '@kilimopro/cache-client';
import { createSuccessResponse, createErrorResponse, ErrorType } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('farm-service:plots');
const db = getDatabaseClient('farm-service');
const cache = getCacheClient('farm-service');

// Schemas
const PlotSchema = z.object({
  id: z.string(),
  farmId: z.string(),
  name: z.string().min(1).max(100),
  sizeHectares: z.number().min(0).max(1000),
  cropType: z.string().min(1).max(50).optional(),
  variety: z.string().min(1).max(50).optional(),
  plantingDate: z.string().datetime().optional(),
  expectedHarvestDate: z.string().datetime().optional(),
  status: z.enum(['EMPTY', 'PREPARING', 'PLANTED', 'GROWING', 'HARVESTING', 'HARVESTED', 'FALLOW']).default('EMPTY'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const CreatePlotSchema = z.object({
  name: z.string().min(1).max(100),
  sizeHectares: z.number().min(0).max(1000),
  cropType: z.string().min(1).max(50).optional(),
  variety: z.string().min(1).max(50).optional(),
  plantingDate: z.string().datetime().optional(),
  expectedHarvestDate: z.string().datetime().optional(),
  status: z.enum(['EMPTY', 'PREPARING', 'PLANTED', 'GROWING', 'HARVESTING', 'HARVESTED', 'FALLOW']).default('EMPTY'),
});

const UpdatePlotSchema = CreatePlotSchema.partial();

export const plotRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all plots for a farm
  fastify.get('/:farmId/plots', {
    schema: {
      params: z.object({
        farmId: z.string(),
      }),
      querystring: z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        status: z.enum(['EMPTY', 'PREPARING', 'PLANTED', 'GROWING', 'HARVESTING', 'HARVESTED', 'FALLOW']).optional(),
        cropType: z.string().optional(),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                plots: { type: 'array', items: PlotSchema },
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
      const { page, limit, status, cropType } = request.query as {
        page: number;
        limit: number;
        status?: string;
        cropType?: string;
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
            message: 'You can only access plots in your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        // Build query
        const where: Record<string, any> = { farmId };
        
        if (status) {
          where.status = status;
        }
        
        if (cropType) {
          where.cropType = { contains: cropType, mode: 'insensitive' };
        }

        // Query plots
        const [plots, total] = await Promise.all([
          db.prisma.plot.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.prisma.plot.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return createSuccessResponse({
          data: {
            plots: plots.map(plot => ({
              id: plot.id,
              farmId: plot.farmId,
              name: plot.name,
              sizeHectares: plot.sizeHectares,
              cropType: plot.cropType || undefined,
              variety: plot.variety || undefined,
              plantingDate: plot.plantingDate?.toISOString() || undefined,
              expectedHarvestDate: plot.expectedHarvestDate?.toISOString() || undefined,
              status: plot.status,
              createdAt: plot.createdAt.toISOString(),
              updatedAt: plot.updatedAt.toISOString(),
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
        logger.error('Failed to get farm plots', {
          error: error as Error,
          farmId,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve plots',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Create new plot
  fastify.post('/:farmId/plots', {
    schema: {
      params: z.object({
        farmId: z.string(),
      }),
      body: CreatePlotSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                plot: PlotSchema,
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

      const { name, sizeHectares, cropType, variety, plantingDate, expectedHarvestDate, status } = request.body;

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
            message: 'You can only create plots in your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        // Create new plot
        const plot = await db.prisma.plot.create({
          data: {
            farmId,
            name,
            sizeHectares,
            cropType,
            variety,
            plantingDate: plantingDate ? new Date(plantingDate) : undefined,
            expectedHarvestDate: expectedHarvestDate ? new Date(expectedHarvestDate) : undefined,
            status,
          },
        });

        // Invalidate cache
        await cache.delete(`farm:${farmId}:plots:*`);

        logger.info('New plot created', {
          plotId: plot.id,
          farmId,
          userId: user.id,
          name,
          sizeHectares,
        });

        return reply.status(201).send(createSuccessResponse({
          data: {
            plot: {
              id: plot.id,
              farmId: plot.farmId,
              name: plot.name,
              sizeHectares: plot.sizeHectares,
              cropType: plot.cropType || undefined,
              variety: plot.variety || undefined,
              plantingDate: plot.plantingDate?.toISOString() || undefined,
              expectedHarvestDate: plot.expectedHarvestDate?.toISOString() || undefined,
              status: plot.status,
              createdAt: plot.createdAt.toISOString(),
              updatedAt: plot.updatedAt.toISOString(),
            },
            message: 'Plot created successfully',
          },
          requestId: request.id,
        }));
      } catch (error) {
        logger.error('Failed to create plot', {
          error: error as Error,
          farmId,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to create plot',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Get specific plot by ID
  fastify.get('/:farmId/plots/:plotId', {
    schema: {
      params: z.object({
        farmId: z.string(),
        plotId: z.string(),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                plot: PlotSchema,
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
      const { farmId, plotId } = request.params as { farmId: string; plotId: string };
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
        // Get plot
        const plot = await db.prisma.plot.findUnique({ where: { id: plotId } });
        
        if (!plot) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Plot not found',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        // Check if user owns the farm
        const farm = await db.prisma.farm.findUnique({ where: { id: plot.farmId } });
        
        if (!farm || (farm.userId !== user.id && user.role !== 'admin')) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.FORBIDDEN,
            message: 'You can only access plots in your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        return createSuccessResponse({
          data: {
            plot: {
              id: plot.id,
              farmId: plot.farmId,
              name: plot.name,
              sizeHectares: plot.sizeHectares,
              cropType: plot.cropType || undefined,
              variety: plot.variety || undefined,
              plantingDate: plot.plantingDate?.toISOString() || undefined,
              expectedHarvestDate: plot.expectedHarvestDate?.toISOString() || undefined,
              status: plot.status,
              createdAt: plot.createdAt.toISOString(),
              updatedAt: plot.updatedAt.toISOString(),
            },
          },
          requestId: request.id,
        });
      } catch (error) {
        logger.error('Failed to get plot', {
          error: error as Error,
          plotId,
          farmId,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve plot',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Update plot
  fastify.put('/:farmId/plots/:plotId', {
    schema: {
      params: z.object({
        farmId: z.string(),
        plotId: z.string(),
      }),
      body: UpdatePlotSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                plot: PlotSchema,
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
      const { farmId, plotId } = request.params as { farmId: string; plotId: string };
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
        // Get plot
        const plot = await db.prisma.plot.findUnique({ where: { id: plotId } });
        
        if (!plot) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Plot not found',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        // Check if user owns the farm
        const farm = await db.prisma.farm.findUnique({ where: { id: plot.farmId } });
        
        if (!farm || (farm.userId !== user.id && user.role !== 'admin')) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.FORBIDDEN,
            message: 'You can only update plots in your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        // Update plot
        const updatedPlot = await db.prisma.plot.update({
          where: { id: plotId },
          data: updateData,
        });

        // Invalidate cache
        await cache.delete(`farm:${farmId}:plots:*`);
        await cache.delete(`plot:${plotId}`);

        logger.info('Plot updated', {
          plotId,
          farmId,
          userId: user.id,
          updates: Object.keys(updateData),
        });

        return createSuccessResponse({
          data: {
            plot: {
              id: updatedPlot.id,
              farmId: updatedPlot.farmId,
              name: updatedPlot.name,
              sizeHectares: updatedPlot.sizeHectares,
              cropType: updatedPlot.cropType || undefined,
              variety: updatedPlot.variety || undefined,
              plantingDate: updatedPlot.plantingDate?.toISOString() || undefined,
              expectedHarvestDate: updatedPlot.expectedHarvestDate?.toISOString() || undefined,
              status: updatedPlot.status,
              createdAt: updatedPlot.createdAt.toISOString(),
              updatedAt: updatedPlot.updatedAt.toISOString(),
            },
            message: 'Plot updated successfully',
          },
          requestId: request.id,
        });
      } catch (error) {
        logger.error('Failed to update plot', {
          error: error as Error,
          plotId,
          farmId,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to update plot',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Delete plot
  fastify.delete('/:farmId/plots/:plotId', {
    schema: {
      params: z.object({
        farmId: z.string(),
        plotId: z.string(),
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
                plotId: { type: 'string' },
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
      const { farmId, plotId } = request.params as { farmId: string; plotId: string };
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
        // Get plot
        const plot = await db.prisma.plot.findUnique({ where: { id: plotId } });
        
        if (!plot) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Plot not found',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        // Check if user owns the farm
        const farm = await db.prisma.farm.findUnique({ where: { id: plot.farmId } });
        
        if (!farm || (farm.userId !== user.id && user.role !== 'admin')) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.FORBIDDEN,
            message: 'You can only delete plots in your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        // Delete plot (and all related observations)
        await db.prisma.plot.delete({
          where: { id: plotId },
        });

        // Invalidate cache
        await cache.delete(`farm:${farmId}:plots:*`);
        await cache.delete(`plot:${plotId}`);

        logger.info('Plot deleted', {
          plotId,
          farmId,
          userId: user.id,
        });

        return createSuccessResponse({
          data: {
            message: 'Plot deleted successfully',
            plotId,
          },
          requestId: request.id,
        });
      } catch (error) {
        logger.error('Failed to delete plot', {
          error: error as Error,
          plotId,
          farmId,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to delete plot',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });
};
