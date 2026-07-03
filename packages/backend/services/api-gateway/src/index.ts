/**
 * API Gateway
 * Single entry point for all KilimoPRO microservices
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { getMessageQueueClient } from '@kilimopro/message-queue';
import { weatherRoutes } from './routes/weather.js';
import { marketRoutes } from './routes/market.js';
import { userRoutes } from './routes/user.js';
import { authRoutes } from './routes/auth.js';
import { advisoryRoutes } from './routes/advisory.js';
import { diseaseRoutes } from './routes/disease.js';
import { farmRoutes } from './routes/farm.js';
import { errorHandler } from './utils/errorHandler.js';
import { config } from './config/index.js';
import { authenticate } from './middleware/authenticate.js';

const logger = getLogger('api-gateway');

// Initialize clients
const cache = getCacheClient('api-gateway');
const mq = getMessageQueueClient('api-gateway');

async function start() {
  const app = Fastify({
    logger: false,
    disableRequestLogging: true,
  });

  // Connect to services
  try {
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

  // Rate limiting - per user and per endpoint
  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      const userId = (req as any).user?.id;
      return userId ? `user:${userId}` : `ip:${req.ip}`;
    },
  });

  await app.register(swagger, {
    swagger: {
      info: {
        title: 'KilimoPRO API Gateway',
        description: 'Single entry point for all KilimoPRO microservices',
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
    const cacheHealthy = await cache.healthCheck();
    const mqHealthy = await mq.healthCheck();
    
    // Check service health
    const serviceHealth = await Promise.allSettled([
      fetch(`${config.services.weather}/health`).then(r => r.ok()).catch(() => false),
      fetch(`${config.services.market}/health`).then(r => r.ok()).catch(() => false),
      fetch(`${config.services.user}/health`).then(r => r.ok()).catch(() => false),
    ]);
    
    const services = {
      weather: serviceHealth[0].status === 'fulfilled' ? serviceHealth[0].value : false,
      market: serviceHealth[1].status === 'fulfilled' ? serviceHealth[1].value : false,
      user: serviceHealth[2].status === 'fulfilled' ? serviceHealth[2].value : false,
    };
    
    return {
      status: cacheHealthy && mqHealthy && Object.values(services).every(Boolean) ? 'healthy' : 'degraded',
      service: 'api-gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        cache: cacheHealthy ? 'up' : 'down',
        messageQueue: mqHealthy ? 'up' : 'down',
        ...services,
      },
    };
  });

  // Add request context
  app.addHook('onRequest', async (request, reply) => {
    // Add start time for duration tracking
    (request as any).startTime = Date.now();
  });

  // Add response headers
  app.addHook('onSend', async (request, reply, payload) => {
    const duration = Date.now() - (request as any).startTime;
    reply.header('X-Request-Id', request.id);
    reply.header('X-Response-Time', `${duration}ms`);
    return payload;
  });

  // API Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(weatherRoutes, { prefix: '/api/weather' });
  await app.register(marketRoutes, { prefix: '/api/market' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(advisoryRoutes, { prefix: '/api/advisory' });
  await app.register(diseaseRoutes, { prefix: '/api/disease' });
  await app.register(farmRoutes, { prefix: '/api/farm' });

  // Start server
  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(`API Gateway running on ${config.host}:${config.port}`);
    logger.info(`API docs at ${config.host}:${config.port}/docs`);
  } catch (err) {
    logger.error('Failed to start server', { error: err as Error });
    process.exit(1);
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await app.close();
    await cache.disconnect();
    await mq.disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    await app.close();
    await cache.disconnect();
    await mq.disconnect();
    process.exit(0);
  });
}

start();
