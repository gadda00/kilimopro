/**
 * Advisory Content Routes
 * Manages educational and advisory content for farmers
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { createSuccessResponse, createErrorResponse, ErrorType } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('advisory-service:content');
const cache = getCacheClient('advisory-service');

// Schemas
const ContentQuerySchema = z.object({
  category: z.string().optional(),
  crop: z.string().optional(),
  county: z.string().optional(),
  language: z.enum(['en', 'sw']).default('en'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const ContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  category: z.string(),
  crop: z.string().optional(),
  county: z.string().optional(),
  language: z.enum(['en', 'sw']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  publishedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  author: z.string(),
  tags: z.array(z.string()).default([]),
  actionUrl: z.string().optional(),
});

// Sample advisory content database
const advisoryContent: z.infer<typeof ContentSchema>[] = [
  {
    id: 'adv-001',
    title: 'Maize Planting Guide for Kenya',
    body: 'Plant maize at the onset of rains. Ensure proper spacing of 75cm between rows and 25cm between plants. Use certified seeds for best results.',
    category: 'crop-management',
    crop: 'maize',
    county: 'national',
    language: 'en',
    priority: 'high',
    publishedAt: new Date().toISOString(),
    author: 'KALRO',
    tags: ['maize', 'planting', 'kenya'],
    actionUrl: 'https://kilimo.pro/advisory/maize-planting',
  },
  {
    id: 'adv-002',
    title: 'Mavuno ya Mahindi - Mwongozo wa Kupanda',
    body: 'Panda mahindi wakati wa mvua. Hakikisha umbali wa mita 75 kati ya safu na sentimeta 25 kati ya mimea. Tumia mbegu ya kweli kwa matokeo bora.',
    category: 'crop-management',
    crop: 'maize',
    county: 'national',
    language: 'sw',
    priority: 'high',
    publishedAt: new Date().toISOString(),
    author: 'KALRO',
    tags: ['mahindi', 'kupanda', 'kenya'],
    actionUrl: 'https://kilimo.pro/advisory/mahindi-kupanda',
  },
  {
    id: 'adv-003',
    title: 'Soil Testing and Fertility Management',
    body: 'Test your soil every 2-3 years to determine nutrient levels. Apply organic matter and fertilizers based on test results.',
    category: 'soil-health',
    crop: 'general',
    county: 'national',
    language: 'en',
    priority: 'medium',
    publishedAt: new Date().toISOString(),
    author: 'KALRO',
    tags: ['soil', 'fertility', 'testing'],
  },
  {
    id: 'adv-004',
    title: 'Drought Resistant Crop Varieties',
    body: 'Consider planting drought-resistant varieties like Katumani composite for maize, or Nguzo for beans in dry areas.',
    category: 'climate-resilience',
    crop: 'general',
    county: 'national',
    language: 'en',
    priority: 'high',
    publishedAt: new Date().toISOString(),
    author: 'KALRO',
    tags: ['drought', 'resistant', 'varieties'],
  },
  {
    id: 'adv-005',
    title: 'Integrated Pest Management',
    body: 'Use a combination of cultural, biological, and chemical methods to control pests. Rotate crops and use resistant varieties.',
    category: 'pest-management',
    crop: 'general',
    county: 'national',
    language: 'en',
    priority: 'medium',
    publishedAt: new Date().toISOString(),
    author: 'KALRO',
    tags: ['pest', 'management', 'ipm'],
  },
];

export const contentRoutes: FastifyPluginAsync = async (fastify) => {
  // Get advisory content
  fastify.get('/', {
    schema: {
      querystring: ContentQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                content: { type: 'array', items: ContentSchema },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'number' },
                    limit: { type: 'number' },
                    total: { type: 'number' },
                    totalPages: { type: 'number' },
                  },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { category, crop, county, language, page, limit } = request.query as z.infer<typeof ContentQuerySchema>;
      
      // Generate cache key
      const cacheKey = `advisory:content:${category}:${crop}:${county}:${language}:${page}:${limit}`;
      
      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for advisory content', { cacheKey });
        return JSON.parse(cached);
      }

      // Filter content
      let filteredContent = advisoryContent.filter(content => {
        if (category && content.category !== category) return false;
        if (crop && content.crop !== crop) return false;
        if (county && content.county !== county) return false;
        if (content.language !== language) return false;
        return true;
      });

      // Sort by priority and date
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      filteredContent = filteredContent.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

      // Pagination
      const total = filteredContent.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedContent = filteredContent.slice(startIndex, startIndex + limit);

      // Create response
      const response = createSuccessResponse({
        data: {
          content: paginatedContent,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
        requestId: request.id,
      });

      // Cache the response
      await cache.set(cacheKey, JSON.stringify(response), config.cache.ttl.content);
      
      return response;
    },
  });

  // Get specific content by ID
  fastify.get('/:id', {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                content: ContentSchema,
              },
            },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                message: { type: 'string' },
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      
      const content = advisoryContent.find(c => c.id === id);
      
      if (!content) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.NOT_FOUND,
          message: 'Advisory content not found',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(404).send(errorResponse);
      }

      return createSuccessResponse({
        data: { content },
        requestId: request.id,
      });
    },
  });

  // Get categories
  fastify.get('/categories', {
    handler: async (request, reply) => {
      const categories = [...new Set(advisoryContent.map(c => c.category))];
      
      return createSuccessResponse({
        data: { categories },
        requestId: request.id,
      });
    },
  });
};
