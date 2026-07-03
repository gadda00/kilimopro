/**
 * Disease Detection History Routes
 * Manages user's disease detection history
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getDatabaseClient } from '@kilimopro/db-client';
import { createSuccessResponse, createErrorResponse, ErrorType } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('disease-service:history');
const db = getDatabaseClient('disease-service');

// Schemas
const HistoryQuerySchema = z.object({
  userId: z.string().optional(),
  cropType: z.string().optional(),
  disease: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const DetectionHistorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  imagePath: z.string(),
  detectedDisease: z.string(),
  confidence: z.number().min(0).max(100),
  cropType: z.string().optional(),
  location: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const historyRoutes: FastifyPluginAsync = async (fastify) => {
  // Get detection history
  fastify.get('/', {
    schema: {
      querystring: HistoryQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                history: { type: 'array', items: DetectionHistorySchema },
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
      },
    },
    handler: async (request, reply) => {
      const { userId, cropType, disease, startDate, endDate, page, limit } = request.query as z.infer<typeof HistoryQuerySchema>;
      
      // Authenticate user
      const authenticatedUser = (request as any).user;
      if (!authenticatedUser && !userId) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.UNAUTHORIZED,
          message: 'Authentication required',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(401).send(errorResponse);
      }

      // Use authenticated user if no userId provided
      const targetUserId = userId || authenticatedUser.id;
      
      // Only allow users to access their own history (unless admin)
      if (authenticatedUser.id !== targetUserId && authenticatedUser.role !== 'admin') {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.FORBIDDEN,
          message: 'You can only access your own detection history',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(403).send(errorResponse);
      }

      try {
        // Build query
        const where: Record<string, any> = { userId: targetUserId };
        
        if (cropType) {
          where.cropType = cropType;
        }
        
        if (disease) {
          where.detectedDisease = { contains: disease, mode: 'insensitive' };
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

        // Query database
        const [detections, total] = await Promise.all([
          db.prisma.diseaseDetection.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.prisma.diseaseDetection.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return createSuccessResponse({
          data: {
            history: detections.map(d => ({
              id: d.id,
              userId: d.userId,
              imagePath: d.imagePath,
              detectedDisease: d.detectedDisease,
              confidence: d.confidence,
              cropType: d.cropType || undefined,
              location: d.location || undefined,
              createdAt: d.createdAt.toISOString(),
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
        logger.error('Failed to get detection history', {
          error: error as Error,
          userId: targetUserId,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve detection history',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Get history for specific user (admin only)
  fastify.get('/:userId', {
    schema: {
      params: z.object({
        userId: z.string(),
      }),
      querystring: z.object({
        cropType: z.string().optional(),
        disease: z.string().optional(),
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
                history: { type: 'array', items: DetectionHistorySchema },
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
        403: {
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
      const { userId } = request.params as { userId: string };
      const { cropType, disease, startDate, endDate, page, limit } = request.query as {
        cropType?: string;
        disease?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
      };
      
      // Check admin permissions
      const authenticatedUser = (request as any).user;
      if (!authenticatedUser || authenticatedUser.role !== 'admin') {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.FORBIDDEN,
          message: 'Admin access required to view other users history',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(403).send(errorResponse);
      }

      try {
        // Build query
        const where: Record<string, any> = { userId };
        
        if (cropType) {
          where.cropType = cropType;
        }
        
        if (disease) {
          where.detectedDisease = { contains: disease, mode: 'insensitive' };
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

        // Query database
        const [detections, total] = await Promise.all([
          db.prisma.diseaseDetection.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.prisma.diseaseDetection.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return createSuccessResponse({
          data: {
            history: detections.map(d => ({
              id: d.id,
              userId: d.userId,
              imagePath: d.imagePath,
              detectedDisease: d.detectedDisease,
              confidence: d.confidence,
              cropType: d.cropType || undefined,
              location: d.location || undefined,
              createdAt: d.createdAt.toISOString(),
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
        logger.error('Failed to get user detection history', {
          error: error as Error,
          userId,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve user detection history',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });
};
