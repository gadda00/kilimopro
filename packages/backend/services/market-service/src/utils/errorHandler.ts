/**
 * Error Handler for Market Service
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { Logger } from '@kilimopro/logger';
import { createErrorResponse, KilimoError } from '@kilimopro/shared-types';

export function errorHandler(logger: Logger) {
  return async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.id;
    const path = request.url;
    const method = request.method;

    // Log the error
    logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      requestId,
      path,
      method,
      statusCode: error.statusCode,
    });

    // Handle KilimoError
    if (error instanceof KilimoError) {
      const response = createErrorResponse(error, {
        requestId,
        timestamp: new Date().toISOString(),
        path,
        method,
      });
      return reply.status(error.statusCode).send(response);
    }

    // Handle validation errors
    if (error.name === 'ZodError') {
      const response = createErrorResponse(
        {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          statusCode: 400,
          details: error,
        },
        {
          requestId,
          timestamp: new Date().toISOString(),
          path,
          method,
        }
      );
      return reply.status(400).send(response);
    }

    // Handle not found
    if (error.statusCode === 404) {
      const response = createErrorResponse(
        {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          statusCode: 404,
        },
        {
          requestId,
          timestamp: new Date().toISOString(),
          path,
          method,
        }
      );
      return reply.status(404).send(response);
    }

    // Handle rate limiting
    if (error.statusCode === 429) {
      const response = createErrorResponse(
        {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          statusCode: 429,
        },
        {
          requestId,
          timestamp: new Date().toISOString(),
          path,
          method,
        }
      );
      return reply.status(429).send(response);
    }

    // Default error handler
    const statusCode = error.statusCode || 500;
    const response = createErrorResponse(
      {
        code: 'INTERNAL_ERROR',
        message: config.isProduction ? 'Internal server error' : error.message,
        statusCode,
        details: config.isProduction ? undefined : error,
      },
      {
        requestId,
        timestamp: new Date().toISOString(),
        path,
        method,
      }
    );

    return reply.status(statusCode).send(response);
  };
}

// Import config for error messages
import { config } from '../config/index.js';
