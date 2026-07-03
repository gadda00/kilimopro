/**
 * Weather Service
 * Microservice for weather data and forecasts
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { getLogger } from '@kilimopro/logger';
import { getDatabaseClient } from '@kilimopro/db-client';
import { getCacheClient } from '@kilimopro/cache-client';
import { getMessageQueueClient } from '@kilimopro/message-queue';
import { weatherRoutes } from './routes/weather.js';
import { alertRoutes } from './routes/alerts.js';
import { ndviRoutes } from './routes/ndvi.js';
import { rainfallRoutes } from './routes/rainfall.js';
import { errorHandler } from './utils/errorHandler.js';
import { config } from './config/index.js';

const logger = getLogger('weather-service');

// Initialize clients
const db = getDatabaseClient('weather-service');
const cache = getCacheClient('weather-service');
const mq = getMessageQueueClient('weather-service');

async function start() {
  const app = Fastify({
    logger: false, // We use our own logger
    disableRequestLogging: true,
  });

  // Connect to services
  try {
    await db.connect();
    await cache.connect();
    await mq.connect();
    logger.info('Services connected');
  } catch (error) {
    logger.error('Failed to connect to services', { error: error as Error });
    process.exit(1);
  }

  // Plugins
  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    keyGenerator: (req) => {
      return req.ip || 'anonymous';
    },
  });

  await app.register(swagger, {
    swagger: {
      info: {
        title: 'KilimoPRO Weather Service',
        description: 'Microservice for weather data and forecasts',
        version: '1.0.0',
      },
      host: config.swaggerHost,
      schemes: [config.isProduction ? 'https' : 'http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Error handler
  app.setErrorHandler(errorHandler(logger));

  // Health check
  app.get('/health', async () => {
    const dbHealthy = await db.healthCheck();
    const cacheHealthy = await cache.healthCheck();
    const mqHealthy = await mq.healthCheck();
    
    return {
      status: dbHealthy && cacheHealthy && mqHealthy ? 'healthy' : 'degraded',
      service: 'weather-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbHealthy ? 'up' : 'down',
        cache: cacheHealthy ? 'up' : 'down',
        messageQueue: mqHealthy ? 'up' : 'down',
      },
    };
  });

  // API Routes
  await app.register(weatherRoutes, { prefix: '/api/weather' });
  await app.register(alertRoutes, { prefix: '/api/weather' });
  await app.register(ndviRoutes, { prefix: '/api/weather' });
  await app.register(rainfallRoutes, { prefix: '/api/weather' });

  // Start server
  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(`Weather service running on ${config.host}:${config.port}`);
    logger.info(`API docs at ${config.host}:${config.port}/docs`);
  } catch (err) {
    logger.error('Failed to start server', { error: err as Error });
    process.exit(1);
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await app.close();
    await db.disconnect();
    await cache.disconnect();
    await mq.disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    await app.close();
    await db.disconnect();
    await cache.disconnect();
    await mq.disconnect();
    process.exit(0);
  });
}

start();
