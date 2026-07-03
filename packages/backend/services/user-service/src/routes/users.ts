/**
 * User Management Routes
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { createNotFoundError, createUnauthorizedError, createValidationError } from '@kilimopro/shared-types';
import { config } from '../config/index.js';
import { getDatabaseClient } from '@kilimopro/db-client';

const logger = getLogger('user-service:users');
const cache = getCacheClient('user-service');
const db = getDatabaseClient('user-service');

// Request schemas
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().min(10).max(15).optional(),
  role: z.enum(['farmer', 'cooperative', 'agribusiness', 'government', 'ngo']).default('farmer'),
  county: z.string().optional(),
  location: z.object({
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
  }).optional(),
  language: z.enum(['en', 'sw']).default('en'),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().min(10).max(15).optional(),
  county: z.string().optional(),
  location: z.object({
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
  }).optional(),
  language: z.enum(['en', 'sw']).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const UserQuerySchema = z.object({
  role: z.enum(['farmer', 'cooperative', 'agribusiness', 'government', 'ngo']).optional(),
  county: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  page: z.number().min(1).default(1),
});

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  // Get current user (requires authentication)
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
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' },
                    role: { type: 'string' },
                    county: { type: 'string' },
                    location: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number' },
                        lon: { type: 'number' },
                      },
                    },
                    language: { type: 'string' },
                    permissions: { type: 'array', items: { type: 'string' } },
                    isActive: { type: 'boolean' },
                    emailVerified: { type: 'boolean' },
                    phoneVerified: { type: 'boolean' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                    lastLoginAt: { type: 'string' },
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

      if (!userId) {
        throw createUnauthorizedError('Not authenticated');
      }

      const cacheKey = `user:${userId}`;

      // Try to get from cache
      const cachedUser = await cache.get(cacheKey);
      if (cachedUser) {
        logger.debug('Cache hit for user', { cacheKey });
        return {
          success: true,
          data: { user: cachedUser },
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Get user from database
      const user = await db.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          county: true,
          location: true,
          language: true,
          permissions: true,
          isActive: true,
          emailVerified: true,
          phoneVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        throw createNotFoundError('User', userId);
      }

      // Cache the user
      await cache.set(cacheKey, user, config.cacheTtl.users);

      return {
        success: true,
        data: { user },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });

  // Update current user
  fastify.put('/me', {
    schema: {
      body: UpdateUserSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' },
                    role: { type: 'string' },
                    county: { type: 'string' },
                    location: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number' },
                        lon: { type: 'number' },
                      },
                    },
                    language: { type: 'string' },
                    permissions: { type: 'array', items: { type: 'string' } },
                    isActive: { type: 'boolean' },
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
        400: {
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
      const input = UpdateUserSchema.parse(request.body);

      if (!userId) {
        throw createUnauthorizedError('Not authenticated');
      }

      // Update user
      const user = await db.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          county: input.county,
          location: input.location as any,
          language: input.language,
          permissions: input.permissions,
          isActive: input.isActive,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          county: true,
          location: true,
          language: true,
          permissions: true,
          isActive: true,
          updatedAt: true,
        },
      });

      // Invalidate cache
      await cache.delete(`user:${userId}`);

      // Publish user updated event
      const mq = getMessageQueueClient('user-service');
      await mq.publish('user.updated', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      logger.info('User updated', { userId: user.id });

      return {
        success: true,
        data: { user },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });

  // List users (admin only)
  fastify.get('/', {
    schema: {
      querystring: UserQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                users: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      phone: { type: 'string' },
                      role: { type: 'string' },
                      county: { type: 'string' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string' },
                    },
                  },
                },
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
                code: { type: 'string' },
                message: { type: 'string' },
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
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
    handler: async (request, reply) => {
      const query = UserQuerySchema.parse(request.query);
      const userId = (request as any).user?.id;

      if (!userId) {
        throw createUnauthorizedError('Not authenticated');
      }

      // Build where clause
      const where: any = {};

      if (query.role) where.role = query.role;
      if (query.county) where.county = query.county;
      if (query.isActive !== undefined) where.isActive = query.isActive;
      if (query.search) {
        where.OR = [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      // Get users
      const [users, total] = await Promise.all([
        db.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            county: true,
            isActive: true,
            createdAt: true,
          },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / query.limit);

      return {
        success: true,
        data: {
          users,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages,
          },
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });

  // Get user by ID (admin only)
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
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' },
                    role: { type: 'string' },
                    county: { type: 'string' },
                    location: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number' },
                        lon: { type: 'number' },
                      },
                    },
                    language: { type: 'string' },
                    permissions: { type: 'array', items: { type: 'string' } },
                    isActive: { type: 'boolean' },
                    emailVerified: { type: 'boolean' },
                    phoneVerified: { type: 'boolean' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                    lastLoginAt: { type: 'string' },
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
        403: {
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
    preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request as any).user?.id;

      if (!userId) {
        throw createUnauthorizedError('Not authenticated');
      }

      const cacheKey = `user:${id}`;

      // Try to get from cache
      const cachedUser = await cache.get(cacheKey);
      if (cachedUser) {
        logger.debug('Cache hit for user', { cacheKey });
        return {
          success: true,
          data: { user: cachedUser },
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Get user from database
      const user = await db.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          county: true,
          location: true,
          language: true,
          permissions: true,
          isActive: true,
          emailVerified: true,
          phoneVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        throw createNotFoundError('User', id);
      }

      // Cache the user
      await cache.set(cacheKey, user, config.cacheTtl.users);

      return {
        success: true,
        data: { user },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });

  // Create user (admin only)
  fastify.post('/', {
    schema: {
      body: CreateUserSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    role: { type: 'string' },
                    createdAt: { type: 'string' },
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
        400: {
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
        403: {
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
        409: {
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
    preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
    handler: async (request, reply) => {
      const input = CreateUserSchema.parse(request.body);
      const userId = (request as any).user?.id;

      if (!userId) {
        throw createUnauthorizedError('Not authenticated');
      }

      // Check if user already exists
      const existingUser = await db.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw createValidationError('User with this email already exists', [
          { path: ['email'], message: 'Email already in use', code: 'unique' },
        ]);
      }

      // Hash password
      import bcrypt from 'bcrypt';
      const hashedPassword = await bcrypt.hash(input.password, config.bcrypt.rounds);

      // Create user
      const user = await db.prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          role: input.role,
          county: input.county,
          location: input.location as any,
          language: input.language,
          permissions: input.permissions,
          isActive: input.isActive,
          emailVerified: false,
          phoneVerified: false,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      // Publish user created event
      const mq = getMessageQueueClient('user-service');
      await mq.publish('user.created', {
        userId: user.id,
        email: user.email,
        role: user.role,
        createdBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info('User created', { userId: user.id, createdBy: userId });

      return reply.status(201).send({
        success: true,
        data: { user },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    },
  });

  // Update user (admin only)
  fastify.put('/:id', {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      body: UpdateUserSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' },
                    role: { type: 'string' },
                    county: { type: 'string' },
                    location: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number' },
                        lon: { type: 'number' },
                      },
                    },
                    language: { type: 'string' },
                    permissions: { type: 'array', items: { type: 'string' } },
                    isActive: { type: 'boolean' },
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
        400: {
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
        403: {
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
    preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const input = UpdateUserSchema.parse(request.body);
      const userId = (request as any).user?.id;

      if (!userId) {
        throw createUnauthorizedError('Not authenticated');
      }

      // Update user
      const user = await db.prisma.user.update({
        where: { id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          county: input.county,
          location: input.location as any,
          language: input.language,
          permissions: input.permissions,
          isActive: input.isActive,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          county: true,
          location: true,
          language: true,
          permissions: true,
          isActive: true,
          updatedAt: true,
        },
      });

      // Invalidate cache
      await cache.delete(`user:${id}`);

      // Publish user updated event
      const mq = getMessageQueueClient('user-service');
      await mq.publish('user.updated', {
        userId: user.id,
        updatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info('User updated', { userId: user.id, updatedBy: userId });

      return {
        success: true,
        data: { user },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });

  // Delete user (admin only)
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
            message: { type: 'string' },
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
        403: {
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
    preHandler: [fastify.authenticate, fastify.authorize(['admin'])],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request as any).user?.id;

      if (!userId) {
        throw createUnauthorizedError('Not authenticated');
      }

      // Delete user
      await db.prisma.user.delete({
        where: { id },
      });

      // Invalidate cache
      await cache.delete(`user:${id}`);

      // Delete all sessions for this user
      await db.prisma.session.deleteMany({
        where: { userId: id },
      });

      // Publish user deleted event
      const mq = getMessageQueueClient('user-service');
      await mq.publish('user.deleted', {
        userId: id,
        deletedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info('User deleted', { userId: id, deletedBy: userId });

      return {
        success: true,
        message: 'User deleted successfully.',
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });
};
