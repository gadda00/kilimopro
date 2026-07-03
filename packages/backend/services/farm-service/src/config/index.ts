/**
 * Farm Service Configuration
 */

export interface FarmConfig {
  port: number;
  host: string;
  isProduction: boolean;
  corsOrigins: string | string[];
  rateLimit: {
    max: number;
    timeWindow: string;
  };
  swaggerHost: string;
  services: {
    user: string;
    weather: string;
    market: string;
    advisory: string;
    disease: string;
  };
  cache: {
    ttl: {
      farms: number;
      plots: number;
      observations: number;
      analytics: number;
    };
  };
  analytics: {
    maxDataPoints: number;
    retentionDays: number;
  };
}

const getConfig = (): FarmConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    port: parseInt(process.env.PORT || '3007', 10),
    host: process.env.HOST || '0.0.0.0',
    isProduction,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || '*',
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      timeWindow: process.env.RATE_LIMIT_WINDOW || '15 minutes',
    },
    swaggerHost: process.env.SWAGGER_HOST || `localhost:${process.env.PORT || '3007'}`,
    services: {
      user: process.env.USER_SERVICE_URL || 'http://localhost:3004',
      weather: process.env.WEATHER_SERVICE_URL || 'http://localhost:3002',
      market: process.env.MARKET_SERVICE_URL || 'http://localhost:3003',
      advisory: process.env.ADVISORY_SERVICE_URL || 'http://localhost:3005',
      disease: process.env.DISEASE_SERVICE_URL || 'http://localhost:3006',
    },
    cache: {
      ttl: {
        farms: 30 * 60, // 30 minutes
        plots: 30 * 60, // 30 minutes
        observations: 60 * 60, // 1 hour
        analytics: 5 * 60, // 5 minutes
      },
    },
    analytics: {
      maxDataPoints: 10000, // Maximum number of data points to store per farm
      retentionDays: 365, // 1 year retention
    },
  };
};

export const config = getConfig();
