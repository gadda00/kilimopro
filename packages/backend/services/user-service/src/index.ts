/**
 * User Service
 * Microservice for user management and authentication
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { getLogger } from '@kilimopro/logger';
import { getDatabaseClient } from '@kilimopro/db-client';
import { getCacheClient } from '@kilimopro/cache-client';
import { getMessageQueueClient } from '@kilimopro/message-queue';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { profileRoutes } from './routes/profiles.js';
import { errorHandler } from './utils/errorHandler.js';
import { authenticate, authorize } from './middleware/authenticate.js';
import { config } from './config/index.js';

const logger = getLogger('user-service');

// Initialize clients
const db = getDatabaseClient('user-service');
const cache = getCacheClient('user-service');
const mq = getMessageQueueClient('user-service');

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

  // Register JWT plugin
  await app.register(fastifyJwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });

  // Plugins
  await app.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  });

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
        title: 'KilimoPRO User Service',
        description: 'Microservice for user management and authentication',
        version: '1.0.0',
      },
      host: config.swaggerHost,
      schemes: [config.isProduction ? 'https' : 'http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'JWT token for authentication',
        },
      },
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
      service: 'user-service',
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

  // Register middleware
  app.decorate('authenticate', authenticate);
  app.decorate('authorize', authorize);

  // API Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(profileRoutes, { prefix: '/api/profiles' });

  // Start server
  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(`User service running on ${config.host}:${config.port}`);
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

// Extend Fastify types for JWT and middleware
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      permissions: string[];
    };
  }

  interface FastifyInstance {
    authenticate: typeof authenticate;
    authorize: typeof authorize;
  }
}

start();
