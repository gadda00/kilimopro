/**
 * Authentication Middleware
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { getLogger } from '@kilimopro/logger';
import { createUnauthorizedError } from '@kilimopro/shared-types';
import { config } from '../config/index.js';
import { getDatabaseClient } from '@kilimopro/db-client';

const logger = getLogger('user-service:authenticate');
const db = getDatabaseClient('user-service');

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Get token from header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createUnauthorizedError('No authorization token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = jwt.verify(token, config.jwt.secret) as any;

    // Check if token is valid
    if (!payload || !payload.id) {
      throw createUnauthorizedError('Invalid token');
    }

    // Get user from database
    const user = await db.prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
      },
    });

    if (!user) {
      throw createUnauthorizedError('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw createUnauthorizedError('Account is deactivated');
    }

    // Attach user to request
    (request as any).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
    };

    logger.debug('User authenticated', { userId: user.id, email: user.email });
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error as Error,
      path: request.url,
      method: request.method,
    });
    throw error;
  }
}

export async function authorize(requiredRoles: string[] = []) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;

    if (!user) {
      throw createUnauthorizedError('Not authenticated');
    }

    // If no specific roles required, just check authentication
    if (requiredRoles.length === 0) {
      return;
    }

    // Check if user has required role
    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      // Check if user has required permission
      const hasRequiredPermission = requiredRoles.some((role) =>
        user.permissions && user.permissions.includes(role)
      );

      if (!hasRequiredPermission) {
        throw createUnauthorizedError('Insufficient permissions');
      }
    }

    logger.debug('User authorized', {
      userId: user.id,
      requiredRoles,
      userRole: user.role,
    });
  };
}
