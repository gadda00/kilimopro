/**
 * Authentication Routes
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { getMessageQueueClient } from '@kilimopro/message-queue';
import { createValidationError, createUnauthorizedError, createConflictError } from '@kilimopro/shared-types';
import { config } from '../config/index.js';
import { getDatabaseClient } from '@kilimopro/db-client';

const logger = getLogger('user-service:auth');
const cache = getCacheClient('user-service');
const mq = getMessageQueueClient('user-service');
const db = getDatabaseClient('user-service');

// Request schemas
const RegisterSchema = z.object({
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
  termsAccepted: z.boolean().default(false),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register a new user
  fastify.post('/register', {
    schema: {
      body: RegisterSchema,
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
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'number' },
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
                details: { type: 'object' },
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
    handler: async (request, reply) => {
      const input = RegisterSchema.parse(request.body);

      // Check if user already exists
      const existingUser = await db.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw createConflictError('User', 'email', input.email);
      }

      // Hash password
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
          termsAccepted: input.termsAccepted,
          isActive: true,
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

      // Generate tokens
      const tokens = generateTokens(user);

      // Publish user registered event
      await mq.publish('user.registered', {
        userId: user.id,
        email: user.email,
        role: user.role,
        timestamp: new Date().toISOString(),
      });

      logger.info('User registered', { userId: user.id, email: user.email });

      return reply.status(201).send({
        success: true,
        data: {
          user,
          tokens,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    },
  });

  // Login user
  fastify.post('/login', {
    schema: {
      body: LoginSchema,
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
                    role: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'number' },
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
    handler: async (request, reply) => {
      const input = LoginSchema.parse(request.body);

      // Find user
      const user = await db.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw createUnauthorizedError('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(input.password, user.password);

      if (!isPasswordValid) {
        throw createUnauthorizedError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw createUnauthorizedError('Account is deactivated');
      }

      // Generate tokens
      const tokens = generateTokens(user);

      // Update last login
      await db.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Publish user logged in event
      await mq.publish('user.logged_in', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      logger.info('User logged in', { userId: user.id, email: user.email });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
          },
          tokens,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });

  // Refresh access token
  fastify.post('/refresh', {
    schema: {
      body: RefreshTokenSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                expiresIn: { type: 'number' },
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
    handler: async (request, reply) => {
      const input = RefreshTokenSchema.parse(request.body);

      // Verify refresh token
      let userId: string;

      try {
        const payload = jwt.verify(input.refreshToken, config.jwt.secret) as any;
        userId = payload.id;
      } catch (error) {
        throw createUnauthorizedError('Invalid refresh token');
      }

      // Find user
      const user = await db.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw createUnauthorizedError('User not found');
      }

      // Check if user is active
      if (!user.isActive) {
        throw createUnauthorizedError('Account is deactivated');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions || [],
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Get token expiration time
      const tokenPayload = jwt.decode(accessToken) as any;
      const expiresIn = tokenPayload.exp - tokenPayload.iat;

      logger.info('Token refreshed', { userId: user.id });

      return {
        success: true,
        data: {
          accessToken,
          expiresIn,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });

  // Forgot password
  fastify.post('/forgot-password', {
    schema: {
      body: ForgotPasswordSchema,
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
      },
    },
    handler: async (request, reply) => {
      const input = ForgotPasswordSchema.parse(request.body);

      // Find user
      const user = await db.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        // Don't reveal that user doesn't exist for security
        logger.warn('Forgot password attempt for non-existent email', { email: input.email });
        return {
          success: true,
          message: 'If an account exists with this email, a reset link has been sent.',
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign(
        { id: user.id, email: user.email, type: 'password_reset' },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      // In production, send email with reset link
      // For now, just log it
      logger.info('Password reset token generated', { userId: user.id, email: user.email });

      // Publish password reset requested event
      await mq.publish('user.password_reset_requested', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.',
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });

  // Reset password
  fastify.post('/reset-password', {
    schema: {
      body: ResetPasswordSchema,
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
    handler: async (request, reply) => {
      const input = ResetPasswordSchema.parse(request.body);

      // Verify reset token
      let userId: string;

      try {
        const payload = jwt.verify(input.token, config.jwt.secret) as any;
        
        if (payload.type !== 'password_reset') {
          throw createUnauthorizedError('Invalid reset token');
        }
        
        userId = payload.id;
      } catch (error) {
        throw createUnauthorizedError('Invalid or expired reset token');
      }

      // Find user
      const user = await db.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw createUnauthorizedError('User not found');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(input.password, config.bcrypt.rounds);

      // Update password
      await db.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Invalidate all existing sessions
      await db.prisma.session.deleteMany({
        where: { userId: user.id },
      });

      // Publish password reset event
      await mq.publish('user.password_reset', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      logger.info('Password reset', { userId: user.id });

      return {
        success: true,
        message: 'Password has been reset successfully.',
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });

  // Logout user
  fastify.post('/logout', {
    schema: {
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
      },
    },
    handler: async (request, reply) => {
      const userId = (request as any).user?.id;

      if (!userId) {
        throw createUnauthorizedError('Not authenticated');
      }

      // Delete all sessions for this user
      await db.prisma.session.deleteMany({
        where: { userId },
      });

      // Publish logout event
      await mq.publish('user.logged_out', {
        userId,
        timestamp: new Date().toISOString(),
      });

      logger.info('User logged out', { userId });

      return {
        success: true,
        message: 'Logged out successfully.',
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });
};

// Helper functions
function generateTokens(user: any) {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: 'refresh',
    },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  // Get token expiration time
  const accessTokenPayload = jwt.decode(accessToken) as any;
  const expiresIn = accessTokenPayload.exp - accessTokenPayload.iat;

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}
