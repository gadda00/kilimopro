/**
 * Authentication Middleware
 * JWT validation and user context injection
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { config } from '../config/index.js';
import { createUnauthorizedError, createForbiddenError } from '@kilimopro/shared-types';

const logger = getLogger('auth-middleware');
const cache = getCacheClient('auth-middleware');

interface JwtPayload {
  userId: string;
  phone: string;
  role: string;
  iat: number;
  exp: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/otp',
  '/api/auth/verify',
  '/api/health',
  '/api/docs',
  '/docs',
];

// Routes that require specific roles
const ROLE_ROUTES: Record<string, string[]> = {
  '/api/users': ['admin', 'super_admin'],
  '/api/users/*': ['admin', 'super_admin'],
  '/api/advisory/create': ['extension_officer', 'admin', 'super_admin'],
  '/api/advisory/*/publish': ['extension_officer', 'admin', 'super_admin'],
  '/api/advisory/*/delete': ['extension_officer', 'admin', 'super_admin'],
};

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const path = request.url.split('?')[0];
  
  // Skip authentication for public routes
  if (PUBLIC_ROUTES.some(route => path.startsWith(route))) {
    return;
  }

  // Get token from header
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createUnauthorizedError('Authentication required');
  }

  const token = authHeader.substring(7);
  
  try {
    // Check cache for revoked tokens
    const isRevoked = await cache.get<string>(`revoked:${token}`);
    if (isRevoked) {
      throw createUnauthorizedError('Token revoked');
    }

    // Verify JWT
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Check if token is blacklisted
    const isBlacklisted = await cache.get<string>(`blacklist:${token}`);
    if (isBlacklisted) {
      throw createUnauthorizedError('Token invalidated');
    }

    // Attach user to request
    request.user = payload;
    
    // Check role-based access
    const requiredRoles = Object.entries(ROLE_ROUTES).find(([route]) => {
      return path.startsWith(route.replace('*', ''));
    })?.[1];
    
    if (requiredRoles && !requiredRoles.includes(payload.role)) {
      throw createForbiddenError('Insufficient permissions');
    }

    // Cache user data for performance
    const userCacheKey = `user:${payload.userId}`;
    const cachedUser = await cache.get<any>(userCacheKey);
    
    if (cachedUser) {
      request.user = { ...payload, ...cachedUser };
    }

    logger.debug('User authenticated', {
      userId: payload.userId,
      phone: payload.phone,
      role: payload.role,
      path,
    });
  } catch (error) {
    logger.warn('Authentication failed', {
      error: (error as Error).message,
      path,
    });
    throw createUnauthorizedError('Invalid or expired token');
  }
}

// Token validation utility
export function validateToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch (error) {
    throw createUnauthorizedError('Invalid token');
  }
}

// Generate tokens
export function generateTokens(userId: string, phone: string, role: string) {
  const accessToken = jwt.sign(
    { userId, phone, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  const refreshToken = jwt.sign(
    { userId, phone, role },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
  
  return { accessToken, refreshToken };
}

// Invalidate token
export async function invalidateToken(token: string, isRefreshToken: boolean = false) {
  const ttl = isRefreshToken 
    ? Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days for refresh tokens
    : Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes for access tokens
  
  await cache.set(`blacklist:${token}`, 'true', ttl);
}

// Revoke all tokens for a user
export async function revokeUserTokens(userId: string) {
  // In production, this would query the database for all active tokens
  // For now, we'll just log the action
  logger.info('Tokens revoked for user', { userId });
}
