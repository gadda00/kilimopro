/**
 * Disease Service Configuration
 */

export interface DiseaseConfig {
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
    advisory: string;
  };
  cache: {
    ttl: {
      detections: number;
      models: number;
      alerts: number;
    };
  };
  ml: {
    modelPath: string;
    confidenceThreshold: number;
    maxImageSize: number;
  };
  alerts: {
    threshold: number;
    cooldown: number;
  };
}

const getConfig = (): DiseaseConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    port: parseInt(process.env.PORT || '3006', 10),
    host: process.env.HOST || '0.0.0.0',
    isProduction,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || '*',
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      timeWindow: process.env.RATE_LIMIT_WINDOW || '15 minutes',
    },
    swaggerHost: process.env.SWAGGER_HOST || `localhost:${process.env.PORT || '3006'}`,
    services: {
      user: process.env.USER_SERVICE_URL || 'http://localhost:3004',
      weather: process.env.WEATHER_SERVICE_URL || 'http://localhost:3002',
      advisory: process.env.ADVISORY_SERVICE_URL || 'http://localhost:3005',
    },
    cache: {
      ttl: {
        detections: 24 * 60 * 60, // 24 hours
        models: 7 * 24 * 60 * 60, // 7 days
        alerts: 60 * 60, // 1 hour
      },
    },
    ml: {
      modelPath: process.env.ML_MODEL_PATH || './models/crop_disease_model.tflite',
      confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7'),
      maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '5242880'), // 5MB
    },
    alerts: {
      threshold: parseFloat(process.env.ALERT_THRESHOLD || '0.8'), // 80% confidence
      cooldown: parseInt(process.env.ALERT_COOLDOWN || '86400'), // 24 hours
    },
  };
};

export const config = getConfig();
