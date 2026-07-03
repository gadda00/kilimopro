/**
 * Weather Service Configuration
 */

import dotenv from 'dotenv';

dotenv.config();

interface RateLimitConfig {
  max: number;
  timeWindow: string;
}

interface SwaggerConfig {
  host: string;
  schemes: string[];
}

interface Config {
  port: number;
  host: string;
  isProduction: boolean;
  corsOrigins: string | string[] | boolean;
  rateLimit: RateLimitConfig;
  swaggerHost: string;
  
  // External API keys
  openweatherApiKey?: string;
  kaopApiUrl?: string;
  kaopApiKey?: string;
  
  // Cache settings
  cacheTtl: {
    forecast: number;
    alerts: number;
    ndvi: number;
    rainfall: number;
  };
}

const isProduction = process.env.NODE_ENV === 'production';

const config: Config = {
  port: parseInt(process.env.PORT || '3002'),
  host: process.env.HOST || '0.0.0.0',
  isProduction,
  corsOrigins: isProduction 
    ? ['https://kilimo.pro', 'https://www.kilimo.pro']
    : true,
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
  },
  swaggerHost: process.env.SWAGGER_HOST || `localhost:${process.env.PORT || '3002'}`,
  
  // External API keys
  openweatherApiKey: process.env.OPENWEATHER_API_KEY,
  kaopApiUrl: process.env.KAOP_API_URL,
  kaopApiKey: process.env.KAOP_API_KEY,
  
  // Cache TTLs (in seconds)
  cacheTtl: {
    forecast: parseInt(process.env.CACHE_TTL_FORECAST || '3600'), // 1 hour
    alerts: parseInt(process.env.CACHE_TTL_ALERTS || '1800'), // 30 minutes
    ndvi: parseInt(process.env.CACHE_TTL_NDVI || '86400'), // 24 hours
    rainfall: parseInt(process.env.CACHE_TTL_RAINFALL || '3600'), // 1 hour
  },
};

export { config };
