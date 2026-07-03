/**
 * Standardized error types for KilimoPRO
 */

import { z } from 'zod';

// Error codes
export enum ErrorCode {
  // 4xx Client Errors
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  CONFLICT = 'CONFLICT',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  
  // 5xx Server Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  
  // Domain-specific errors
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  DATA_SOURCE_UNAVAILABLE = 'DATA_SOURCE_UNAVAILABLE',
  MODEL_INFERENCE_ERROR = 'MODEL_INFERENCE_ERROR',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  GEOLOCATION_ERROR = 'GEOLOCATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  MESSAGE_QUEUE_ERROR = 'MESSAGE_QUEUE_ERROR',
}

// Error schema
export const ApiErrorSchema = z.object({
  code: z.nativeEnum(ErrorCode),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
  requestId: z.string().optional(),
  stack: z.string().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// Validation error
export const ValidationErrorSchema = z.object({
  code: z.literal(ErrorCode.VALIDATION_ERROR),
  message: z.string(),
  details: z.record(z.array(z.object({
    path: z.array(z.string()),
    message: z.string(),
    code: z.string(),
  }))),
  timestamp: z.string().datetime(),
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

// Not found error
export const NotFoundErrorSchema = z.object({
  code: z.literal(ErrorCode.NOT_FOUND),
  message: z.string(),
  details: z.object({
    resource: z.string(),
    id: z.string().optional(),
    query: z.record(z.any()).optional(),
  }).optional(),
  timestamp: z.string().datetime(),
});

export type NotFoundError = z.infer<typeof NotFoundErrorSchema>;

// Rate limit error
export const RateLimitErrorSchema = z.object({
  code: z.literal(ErrorCode.RATE_LIMITED),
  message: z.string(),
  details: z.object({
    limit: z.number(),
    remaining: z.number(),
    resetAt: z.string().datetime(),
    window: z.string(), // 'minute', 'hour', 'day'
  }),
  timestamp: z.string().datetime(),
});

export type RateLimitError = z.infer<typeof RateLimitErrorSchema>;

// Helper to create errors
export class KilimoError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, any>,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'KilimoError';
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

// Common error creators
export function createValidationError(
  message: string,
  errors: Array<{ path: string[]; message: string; code: string }>
): KilimoError {
  return new KilimoError(
    ErrorCode.VALIDATION_ERROR,
    message,
    { errors },
    400
  );
}

export function createNotFoundError(
  resource: string,
  id?: string,
  query?: Record<string, any>
): KilimoError {
  return new KilimoError(
    ErrorCode.NOT_FOUND,
    `${resource} not found`,
    { resource, id, query },
    404
  );
}

export function createRateLimitError(
  limit: number,
  remaining: number,
  resetAt: Date,
  window: string
): KilimoError {
  return new KilimoError(
    ErrorCode.RATE_LIMITED,
    'Rate limit exceeded',
    { limit, remaining, resetAt: resetAt.toISOString(), window },
    429
  );
}

export function createUnauthorizedError(message = 'Unauthorized'): KilimoError {
  return new KilimoError(ErrorCode.UNAUTHORIZED, message, undefined, 401);
}

export function createForbiddenError(message = 'Forbidden'): KilimoError {
  return new KilimoError(ErrorCode.FORBIDDEN, message, undefined, 403);
}

export function createInternalError(
  message = 'Internal server error',
  details?: Record<string, any>
): KilimoError {
  return new KilimoError(ErrorCode.INTERNAL_ERROR, message, details, 500);
}
