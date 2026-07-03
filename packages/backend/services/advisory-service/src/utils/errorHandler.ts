/**
 * Error Handler for Advisory Service
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { Logger } from '@kilimopro/logger';
import { createErrorResponse, ErrorType } from '@kilimopro/shared-types';

export function errorHandler(logger: Logger) {
  return async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.id;
    const userId = (request as any).user?.id;

    // Log the error
    logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      requestId,
      userId,
      method: request.method,
      url: request.url,
      statusCode: error.statusCode,
    });

    // Determine error type
    let errorType: ErrorType = ErrorType.INTERNAL_SERVER_ERROR;
    let statusCode = error.statusCode || 500;
    let message = error.message;

    // Handle validation errors
    if (error.name === 'ZodError') {
      errorType = ErrorType.VALIDATION_ERROR;
      statusCode = 400;
      message = 'Validation failed';
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      errorType = ErrorType.UNAUTHORIZED;
      statusCode = 401;
      message = 'Invalid token';
    }

    if (error.name === 'TokenExpiredError') {
      errorType = ErrorType.UNAUTHORIZED;
      statusCode = 401;
      message = 'Token expired';
    }

    // Handle not found
    if (error.name === 'NotFoundError' || statusCode === 404) {
      errorType = ErrorType.NOT_FOUND;
      statusCode = 404;
    }

    // Handle unauthorized
    if (statusCode === 401) {
      errorType = ErrorType.UNAUTHORIZED;
    }

    // Handle forbidden
    if (statusCode === 403) {
      errorType = ErrorType.FORBIDDEN;
    }

    // Create error response
    const errorResponse = createErrorResponse({
      errorType,
      message,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      details: errorType === ErrorType.VALIDATION_ERROR ? error : undefined,
    });

    reply.status(statusCode).send(errorResponse);
  };
}
