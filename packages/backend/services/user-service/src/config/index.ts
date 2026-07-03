/**
 * User Service Configuration
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3004'),
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
    sessions: parseInt(process.env.CACHE_TTL_SESSIONS || '300'), // 5 minutes
    users: parseInt(process.env.CACHE_TTL_USERS || '3600'), // 1 hour
  },

  // Message queue configuration
  nats: {
    servers: process.env.NATS_SERVERS || 'nats://localhost:4222',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // API configuration
  swaggerHost: process.env.SWAGGER_HOST || 'localhost:3004',

  // Rate limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000'), // 1 minute
  },

  // Password configuration
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  },

  // Service URLs (for inter-service communication)
  services: {
    apiGateway: process.env.API_GATEWAY_URL || 'http://localhost:3001',
    weather: process.env.WEATHER_SERVICE_URL || 'http://localhost:3002',
    market: process.env.MARKET_SERVICE_URL || 'http://localhost:3003',
  },
};
