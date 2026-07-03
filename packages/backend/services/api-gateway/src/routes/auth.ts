/**
 * Authentication Routes
 * Handles user authentication
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { getMessageQueueClient } from '@kilimopro/message-queue';
import { 
  CreateUserRequestSchema,
  AuthCredentialsSchema,
  AuthResponseSchema,
  RefreshTokenResponseSchema,
  UserProfile,
  UserRole,
} from '@kilimopro/shared-types';
import { config } from '../config/index.js';
import { generateTokens, validateToken, invalidateToken } from '../middleware/authenticate.js';
import { createValidationError, createUnauthorizedError } from '@kilimopro/shared-types';

const logger = getLogger('auth-routes');
const cache = getCacheClient('auth-routes');
const mq = getMessageQueueClient('auth-routes');

// In-memory user store (replace with database in production)
const users: Record<string, { phone: string; password?: string; role: UserRole; name?: string }> = {};

export async function authRoutes(app: FastifyInstance, options: FastifyPluginOptions) {
  // Register new user
  app.post('/register', {
    schema: {
      body: CreateUserRequestSchema,
      response: {
        201: AuthResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const body = request.body as unknown as {
        phone: string;
        email?: string;
        password?: string;
        name?: string;
        role?: UserRole;
        language?: string;
        deviceToken?: string;
      };

      // Validate phone number (Kenyan format)
      const phone = body.phone.replace(/\D/g, '');
      if (!phone.startsWith('254') || phone.length !== 12) {
        throw createValidationError('Invalid phone number', [
          { path: ['phone'], message: 'Phone must be a valid Kenyan number (e.g., 254712345678)', code: 'invalid_format' },
        ]);
      }

      // Check if user already exists
      if (users[phone]) {
        throw createValidationError('User already exists', [
          { path: ['phone'], message: 'Phone number already registered', code: 'already_exists' },
        ]);
      }

      // Create user
      const user = {
        phone,
        password: body.password,
        role: body.role || UserRole.FARMER,
        name: body.name,
      };

      users[phone] = user;

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.phone, user.phone, user.role);

      // Publish user registered event
      await mq.publishEvent({
        id: `user_${Date.now()}`,
        type: 'user.registered',
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'api-gateway',
      });

      logger.info('User registered', { phone, role: user.role });

      reply.status(201);
      return {
        user: {
          id: phone,
          phone,
          name: user.name,
          role: user.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('Registration failed', { error: error as Error });
      throw error;
    }
  });

  // Login
  app.post('/login', {
    schema: {
      body: AuthCredentialsSchema,
      response: {
        200: AuthResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const body = request.body as unknown as {
        phone: string;
        password?: string;
        otp?: string;
        deviceToken?: string;
      };

      const phone = body.phone.replace(/\D/g, '');
      const user = users[phone];

      if (!user) {
        throw createUnauthorizedError('Invalid credentials');
      }

      // In production, verify password or OTP
      // For now, just check if user exists
      if (body.password && user.password && body.password !== user.password) {
        throw createUnauthorizedError('Invalid credentials');
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.phone, user.phone, user.role);

      // Cache user session
      await cache.set(`session:${accessToken}`, user, config.cacheTtl.auth);

      // Publish user login event
      await mq.publishEvent({
        id: `login_${Date.now()}`,
        type: 'user.login',
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'api-gateway',
      });

      logger.info('User logged in', { phone, role: user.role });

      return {
        user: {
          id: phone,
          phone,
          name: user.name,
          role: user.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('Login failed', { error: error as Error });
      throw error;
    }
  });

  // Refresh token
  app.post('/refresh', {
    schema: {
      body: z.object({
        refreshToken: z.string(),
      }),
      response: {
        200: RefreshTokenResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };

      // Validate refresh token
      const payload = validateToken(refreshToken);
      const user = users[payload.phone];

      if (!user) {
        throw createUnauthorizedError('Invalid token');
      }

      // Check if refresh token is blacklisted
      const isBlacklisted = await cache.get<string>(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        throw createUnauthorizedError('Token invalidated');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(
        user.phone, 
        user.phone, 
        user.role
      );

      // Invalidate old refresh token
      await invalidateToken(refreshToken, true);

      logger.info('Token refreshed', { userId: payload.userId });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60, // 15 minutes
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('Token refresh failed', { error: error as Error });
      throw error;
    }
  });

  // Logout
  app.post('/logout', {
    schema: {
      headers: z.object({
        authorization: z.string(),
      }),
    },
  }, async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createUnauthorizedError('Authentication required');
      }

      const token = authHeader.substring(7);
      
      // Invalidate token
      await invalidateToken(token);

      // Get user from token
      const payload = validateToken(token);
      
      // Publish user logout event
      await mq.publishEvent({
        id: `logout_${Date.now()}`,
        type: 'user.logout',
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'api-gateway',
      });

      logger.info('User logged out', { userId: payload.userId });

      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      logger.error('Logout failed', { error: error as Error });
      throw error;
    }
  });

  // OTP request (for SMS authentication)
  app.post('/otp', {
    schema: {
      body: z.object({
        phone: z.string(),
      }),
    },
  }, async (request, reply) => {
    try {
      const { phone } = request.body as { phone: string };
      const cleanPhone = phone.replace(/\D/g, '');

      // In production, send OTP via Africa's Talking
      // For now, just generate a test OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Cache OTP (expires in 5 minutes)
      await cache.set(`otp:${cleanPhone}`, otp, 300);

      // Publish OTP sent event
      await mq.publishEvent({
        id: `otp_${Date.now()}`,
        type: 'user.otp.sent',
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'api-gateway',
      });

      logger.info('OTP sent', { phone: cleanPhone });

      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      logger.error('OTP request failed', { error: error as Error });
      throw error;
    }
  });

  // OTP verification
  app.post('/verify', {
    schema: {
      body: z.object({
        phone: z.string(),
        otp: z.string(),
      }),
      response: {
        200: AuthResponseSchema,
      },
    },
  }, async (request, reply) => {
    try {
      const { phone, otp } = request.body as { phone: string; otp: string };
      const cleanPhone = phone.replace(/\D/g, '');

      // Get cached OTP
      const cachedOtp = await cache.get<string>(`otp:${cleanPhone}`);

      if (!cachedOtp || cachedOtp !== otp) {
        throw createUnauthorizedError('Invalid OTP');
      }

      // Delete OTP after verification
      await cache.delete(`otp:${cleanPhone}`);

      // Get or create user
      let user = users[cleanPhone];
      if (!user) {
        user = {
          phone: cleanPhone,
          role: UserRole.FARMER,
        };
        users[cleanPhone] = user;

        // Publish user registered event
        await mq.publishEvent({
          id: `user_${Date.now()}`,
          type: 'user.registered',
          timestamp: new Date().toISOString(),
          version: '1.0',
          source: 'api-gateway',
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.phone, user.phone, user.role);

      // Publish user login event
      await mq.publishEvent({
        id: `login_${Date.now()}`,
        type: 'user.login',
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'api-gateway',
      });

      logger.info('User verified with OTP', { phone: cleanPhone });

      return {
        user: {
          id: cleanPhone,
          phone: cleanPhone,
          name: user.name,
          role: user.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('OTP verification failed', { error: error as Error });
      throw error;
    }
  });
}

// Import zod for schema validation
import { z } from 'zod';
