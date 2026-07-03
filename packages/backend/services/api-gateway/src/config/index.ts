/**
 * API Gateway Configuration
 */

import dotenv from 'dotenv';

dotenv.config();

interface RateLimitConfig {
  max: number;
  timeWindow: string;
}

interface ServiceConfig {
  weather: string;
  market: string;
  user: string;
  advisory: string;
  disease: string;
  farm: string;
}

interface Config {
  port: number;
  host: string;
  isProduction: boolean;
  corsOrigins: string | string[] | boolean;
  rateLimit: RateLimitConfig;
  swaggerHost: string;
  services: ServiceConfig;
  
  // JWT configuration
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  
  // Cache settings
  cacheTtl: {
    default: number;
    user: number;
    auth: number;
  };
}

const isProduction = process.env.NODE_ENV === 'production';

const config: Config = {
  port: parseInt(process.env.PORT || '3001'),
  host: process.env.HOST || '0.0.0.0',
  isProduction,
  corsOrigins: isProduction 
    ? ['https://kilimo.pro', 'https://www.kilimo.pro']
    : true,
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
  },
  swaggerHost: process.env.SWAGGER_HOST || `localhost:${process.env.PORT || '3001'}`,
  
  services: {
    weather: process.env.WEATHER_SERVICE_URL || 'http://localhost:3002',
    market: process.env.MARKET_SERVICE_URL || 'http://localhost:3003',
    user: process.env.USER_SERVICE_URL || 'http://localhost:3004',
    advisory: process.env.ADVISORY_SERVICE_URL || 'http://localhost:3005',
    disease: process.env.DISEASE_SERVICE_URL || 'http://localhost:3006',
    farm: process.env.FARM_SERVICE_URL || 'http://localhost:3007',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'kilimopro-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  cacheTtl: {
    default: parseInt(process.env.CACHE_TTL_DEFAULT || '300'), // 5 minutes
    user: parseInt(process.env.CACHE_TTL_USER || '300'), // 5 minutes
    auth: parseInt(process.env.CACHE_TTL_AUTH || '60'), // 1 minute
  },
};

export { config };
