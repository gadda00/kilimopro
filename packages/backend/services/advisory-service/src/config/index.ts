/**
 * Advisory Service Configuration
 */

export interface AdvisoryConfig {
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
  };
  cache: {
    ttl: {
      content: number;
      recommendations: number;
      council: number;
    };
  };
  council: {
    personas: string[];
    providers: string[];
    timeout: number;
  };
}

const getConfig = (): AdvisoryConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    port: parseInt(process.env.PORT || '3005', 10),
    host: process.env.HOST || '0.0.0.0',
    isProduction,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || '*',
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      timeWindow: process.env.RATE_LIMIT_WINDOW || '15 minutes',
    },
    swaggerHost: process.env.SWAGGER_HOST || `localhost:${process.env.PORT || '3005'}`,
    services: {
      user: process.env.USER_SERVICE_URL || 'http://localhost:3004',
      weather: process.env.WEATHER_SERVICE_URL || 'http://localhost:3002',
      market: process.env.MARKET_SERVICE_URL || 'http://localhost:3003',
    },
    cache: {
      ttl: {
        content: 24 * 60 * 60, // 24 hours
        recommendations: 6 * 60 * 60, // 6 hours
        council: 30 * 60, // 30 minutes
      },
    },
    council: {
      personas: ['agronomist', 'meteorologist', 'economist', 'veterinarian', 'sustainability'],
      providers: ['openai', 'anthropic', 'google'],
      timeout: 60000, // 60 seconds
    },
  };
};

export const config = getConfig();
