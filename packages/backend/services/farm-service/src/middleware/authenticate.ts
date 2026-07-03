/**
 * Authentication Middleware for Farm Service
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { getLogger } from '@kilimopro/logger';
import { createUnauthorizedError, createForbiddenError } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('farm-service:auth');

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createUnauthorizedError('Authentication required');
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token - in production, this would call the user service
    const decoded = jwt.verify(token, config.services.user + '/api/auth/verify') as JwtPayload;
    
    // Attach user to request
    (request as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions,
    };

    logger.debug('User authenticated', {
      userId: decoded.id,
      role: decoded.role,
      path: request.url,
    });

  } catch (error) {
    logger.warn('Authentication failed', {
      error: error as Error,
      path: request.url,
    });
    
    if (error instanceof jwt.TokenExpiredError) {
      throw createUnauthorizedError('Token expired');
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw createUnauthorizedError('Invalid token');
    }
    
    throw createUnauthorizedError('Authentication failed');
  }
}

export async function authorize(requiredRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    
    if (!user) {
      throw createUnauthorizedError('Authentication required');
    }

    if (!requiredRoles.includes(user.role)) {
      logger.warn('Authorization failed - insufficient permissions', {
        userId: user.id,
        role: user.role,
        requiredRoles,
        path: request.url,
      });
      
      throw createForbiddenError('Insufficient permissions');
    }
  };
}

export async function authorizeFarmAccess(farmId: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    
    if (!user) {
      throw createUnauthorizedError('Authentication required');
    }

    // In production, this would check if the user owns the farm
    // For now, we'll allow access to all farms for demo purposes
    // But in a real implementation, you would:
    // 1. Query the database to get the farm
    // 2. Check if the farm.userId === user.id
    // 3. Or check if user has admin role
    
    logger.debug('Farm access check', {
      userId: user.id,
      farmId,
      role: user.role,
    });

    // For demo purposes, allow access
    return;
  };
}
