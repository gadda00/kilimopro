/**
 * Common types used across all services
 */

// Pagination
export interface PaginatedQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Location
export interface Location {
  latitude: number;
  longitude: number;
  county?: string;
  subCounty?: string;
  ward?: string;
  country?: string;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

// Time ranges
export interface DateRange {
  startDate: string | Date;
  endDate: string | Date;
}

export interface TimeRange {
  startTime: string | Date;
  endTime: string | Date;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

// Health check
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  checks?: Record<string, HealthStatus>;
}

export interface HealthStatus {
  status: 'up' | 'down';
  latency?: number;
  lastCheck?: string;
}

// Request context
export interface RequestContext {
  requestId: string;
  userId?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// Event types
export type EventType =
  | 'weather.forecast.updated'
  | 'weather.alert.created'
  | 'market.price.updated'
  | 'market.trend.detected'
  | 'user.registered'
  | 'user.login'
  | 'disease.detected'
  | 'advisory.created'
  | 'farm.data.updated'
  | 'report.submitted';

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: string;
  version: string;
  source: string;
}

// Metrics
export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: string;
}

// Configuration
export interface ServiceConfig {
  name: string;
  version: string;
  port: number;
  environment: 'development' | 'staging' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  databaseUrl?: string;
  redisUrl?: string;
  messageQueueUrl?: string;
}
