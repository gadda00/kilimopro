/**
 * Error Handler for Weather Service
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { Logger } from '@kilimopro/logger';
import { 
  KilimoError, 
  ApiError, 
  ErrorCode,
  createInternalError,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createRateLimitError
} from '@kilimopro/shared-types';
import { ZodError } from 'zod';

export function errorHandler(logger: Logger) {
  return async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.id;
    const startTime = request.context?.config?.startTime;
    const duration = startTime ? Date.now() - startTime : undefined;

    // Log the error
    logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      requestId,
      method: request.method,
      url: request.url,
      statusCode: error.statusCode,
      duration,
    });

    // Handle different error types
    let apiError: ApiError;

    if (error instanceof KilimoError) {
      // Already a KilimoError
      apiError = error.toJSON();
      apiError.requestId = requestId;
    } else if (error instanceof ZodError) {
      // Validation error
      apiError = createValidationError(
        'Validation error',
        error.errors.map(e => ({
          path: e.path,
          message: e.message,
          code: e.code,
        }))
      ).toJSON();
      apiError.requestId = requestId;
    } else if (error.code === 'FST_RATE_LIMIT_EXCEEDED') {
      // Rate limit error
      const resetAt = new Date(Date.now() + (error as any).ttl);
      apiError = createRateLimitError(
        (error as any).limit,
        (error as any).remaining,
        resetAt,
        'minute'
      ).toJSON();
      apiError.requestId = requestId;
    } else if (error.statusCode === 404) {
      // Not found
      apiError = createNotFoundError('Resource not found').toJSON();
      apiError.requestId = requestId;
    } else if (error.statusCode === 401) {
      // Unauthorized
      apiError = createUnauthorizedError().toJSON();
      apiError.requestId = requestId;
    } else if (error.statusCode === 403) {
      // Forbidden
      apiError = createForbiddenError().toJSON();
      apiError.requestId = requestId;
    } else if (error.statusCode === 429) {
      // Rate limited
      apiError = createRateLimitError(100, 0, new Date(Date.now() + 60000), 'minute').toJSON();
      apiError.requestId = requestId;
    } else {
      // Internal error
      apiError = createInternalError(error.message, {
        stack: error.stack,
        cause: error.cause,
      }).toJSON();
      apiError.requestId = requestId;
    }

    // Set status code
    const statusCode = error.statusCode || 500;
    reply.status(statusCode);

    // Send error response
    reply.send({
      success: false,
      error: apiError,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    });
  };
}
