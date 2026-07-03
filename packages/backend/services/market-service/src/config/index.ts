/**
 * Market Service Configuration
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3003'),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.IS_PRODUCTION === 'true',

  // CORS configuration
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://kilimo.pro',
  ],

  // Database configuration
  databaseUrl: process.env.DATABASE_URL || 'postgresql://kilimopro:kilimopro@localhost:5432/kilimopro',

  // Cache configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  cacheTtl: {
    prices: parseInt(process.env.CACHE_TTL_PRICES || '900'), // 15 minutes
    trends: parseInt(process.env.CACHE_TTL_TRENDS || '3600'), // 1 hour
    forecasts: parseInt(process.env.CACHE_TTL_FORECASTS || '1800'), // 30 minutes
    markets: parseInt(process.env.CACHE_TTL_MARKETS || '86400'), // 24 hours
  },

  // Message queue configuration
  nats: {
    servers: process.env.NATS_SERVERS || 'nats://localhost:4222',
  },

  // API configuration
  swaggerHost: process.env.SWAGGER_HOST || 'localhost:3003',

  // Rate limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000'), // 1 minute
  },

  // External API configuration
  externalApis: {
    airc: {
      baseUrl: process.env.AIRC_BASE_URL || 'https://airc.kilimo.go.ke/api',
      apiKey: process.env.AIRC_API_KEY || '',
    },
    faostat: {
      baseUrl: process.env.FAOSTAT_BASE_URL || 'http://www.fao.org/faostat/en',
      apiKey: process.env.FAOSTAT_API_KEY || '',
    },
  },

  // Service URLs (for inter-service communication)
  services: {
    apiGateway: process.env.API_GATEWAY_URL || 'http://localhost:3001',
    weather: process.env.WEATHER_SERVICE_URL || 'http://localhost:3002',
    user: process.env.USER_SERVICE_URL || 'http://localhost:3004',
  },
};
