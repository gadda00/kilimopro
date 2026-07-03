/**
 * KilimoPRO Backend — Main Server Entry Point
 * Fastify-based API server with 8 microservice route modules
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { authRoutes } from './routes/auth.js';
import { weatherRoutes } from './routes/weather.js';
import { marketRoutes } from './routes/market.js';
import { advisoryRoutes } from './routes/advisory.js';
import { diseaseRoutes } from './routes/disease.js';
import { farmRoutes } from './routes/farm.js';
import { reportRoutes } from './routes/reports.js';
import { statsRoutes } from './routes/stats.js';
import { researchRoutes } from './routes/research.js';
import { errorHandler } from './middleware/errorHandler.js';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

// Initialize clients
export const prisma = new PrismaClient();
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function start() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // ─── Plugins ──────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://kilimo.pro', 'https://www.kilimo.pro']
      : true,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(swagger, {
    swagger: {
      info: {
        title: 'KilimoPRO API',
        description: 'AI-Powered Agricultural Intelligence Platform API',
        version: '1.0.0',
      },
      host: process.env.API_HOST || `localhost:${PORT}`,
      schemes: [process.env.NODE_ENV === 'production' ? 'https' : 'http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // ─── Error Handler ────────────────────────────────────────────────
  app.setErrorHandler(errorHandler);

  // ─── Health Check ─────────────────────────────────────────────────
  app.get('/health', async () => ({
    status: 'healthy',
    service: 'kilimopro-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // ─── API Routes ───────────────────────────────────────────────────
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(weatherRoutes, { prefix: '/api/weather' });
  await app.register(marketRoutes, { prefix: '/api/market' });
  await app.register(advisoryRoutes, { prefix: '/api/advisory' });
  await app.register(diseaseRoutes, { prefix: '/api/disease' });
  await app.register(farmRoutes, { prefix: '/api/farm' });
  await app.register(reportRoutes, { prefix: '/api/reports' });
  await app.register(statsRoutes, { prefix: '/api/stats' });
  await app.register(researchRoutes, { prefix: '/api/research' });

  // ─── Start Server ─────────────────────────────────────────────────
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`🌱 KilimoPRO API running on http://${HOST}:${PORT}`);
    app.log.info(`📚 API docs at http://${HOST}:${PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
