/**
 * Profile Routes
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { createNotFoundError, createUnauthorizedError } from '@kilimopro/shared-types';
import { config } from '../config/index.js';
import { getDatabaseClient } from '@kilimopro/db-client';

const logger = getLogger('user-service:profiles');
const db = getDatabaseClient('user-service');

// Request schemas
const UpdateProfileSchema = z.object({
  farmName: z.string().min(1).max(100).optional(),
  farmSize: z.number().positive().optional(),
  farmSizeUnit: z.enum(['acres', 'hectares', 'square_meters']).optional(),
  crops: z.array(z.string()).optional(),
  livestock: z.array(z.string()).optional(),
  yearsFarming: z.number().min(0).max(100).optional(),
  cooperativeMember: z.boolean().optional(),
  cooperativeName: z.string().optional(),
  preferredLanguage: z.enum(['en', 'sw']).optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
  }).optional(),
});

export const profileRoutes: FastifyPluginAsync = async (fastify) => {
  // Get current user profile
  fastify.get('/me', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                profile: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    userId: { type: 'string' },
                    farmName: { type: 'string' },
                    farmSize: { type: 'number' },
                    farmSizeUnit: { type: 'string' },
                    crops: { type: 'array', items: { type: 'string' } },
                    livestock: { type: 'array', items: { type: 'string' } },
                    yearsFarming: { type: 'number' },
                    cooperativeMember: { type: 'boolean' },
                    cooperativeName: { type: 'string' },
                    preferredLanguage: { type: 'string' },
                    notificationPreferences: {
                      type: 'object',
                      properties: {
                        email: { type: 'boolean' },
                        sms: { type: 'boolean' },
                        push: { type: 'boolean' },
                      },
                    },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
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
                code: { type: 'string' },
                message: { type: 'string' },
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
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const userId = (request as any).user?.id;

      if (!userId) {
        throw createUnauthorizedError('Not authenticated');
      }

      // Get profile
      const profile = await db.prisma.profile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw createNotFoundError('Profile', userId);
      }

      return {
        success: true,
        data: { profile },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });

  // Create or update profile
  fastify.put('/me', {
    schema: {
      body: UpdateProfileSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                profile: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    userId: { type: 'string' },
                    farmName: { type: 'string' },
                    farmSize: { type: 'number' },
                    farmSizeUnit: { type: 'string' },
                    crops: { type: 'array', items: { type: 'string' } },
                    livestock: { type: 'array', items: { type: 'string' } },
                    yearsFarming: { type: 'number' },
                    cooperativeMember: { type: 'boolean' },
                    cooperativeName: { type: 'string' },
                    preferredLanguage: { type: 'string' },
                    notificationPreferences: {
                      type: 'object',
                      properties: {
                        email: { type: 'boolean' },
                        sms: { type: 'boolean' },
                        push: { type: 'boolean' },
                      },
                    },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
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
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const userId = (request as any).user?.id;
      const input = UpdateProfileSchema.parse(request.body);

      if (!userId) {
        throw createUnauthorizedError('Not authenticated');
      }

      // Upsert profile
      const profile = await db.prisma.profile.upsert({
        where: { userId },
        create: {
          userId,
          farmName: input.farmName,
          farmSize: input.farmSize,
          farmSizeUnit: input.farmSizeUnit,
          crops: input.crops,
          livestock: input.livestock,
          yearsFarming: input.yearsFarming,
          cooperativeMember: input.cooperativeMember,
          cooperativeName: input.cooperativeName,
          preferredLanguage: input.preferredLanguage,
          notificationPreferences: input.notificationPreferences as any,
        },
        update: {
          farmName: input.farmName,
          farmSize: input.farmSize,
          farmSizeUnit: input.farmSizeUnit,
          crops: input.crops,
          livestock: input.livestock,
          yearsFarming: input.yearsFarming,
          cooperativeMember: input.cooperativeMember,
          cooperativeName: input.cooperativeName,
          preferredLanguage: input.preferredLanguage,
          notificationPreferences: input.notificationPreferences as any,
        },
      });

      logger.info('Profile updated', { userId: user.id, profileId: profile.id });

      return {
        success: true,
        data: { profile },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });
};
