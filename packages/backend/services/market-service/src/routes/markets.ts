/**
 * Markets Routes
 * Market information and metadata
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { MarketSchema } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('market-service:markets');
const cache = getCacheClient('market-service');

// Kenyan markets data
const KENYAN_MARKETS = [
  {
    id: 'market_001',
    name: 'Nairobi Market',
    county: 'Nairobi',
    region: 'Central',
    type: 'Wholesale',
    coordinates: { lat: -1.2864, lon: 36.8172 },
    commodities: ['Maize', 'Beans', 'Rice', 'Wheat', 'Potatoes', 'Tomatoes', 'Onions', 'Cabbage'],
    operatingHours: '06:00-18:00',
    contact: '+254 700 000 001',
    website: 'https://nairobi.go.ke/markets',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'market_002',
    name: 'Mombasa Market',
    county: 'Mombasa',
    region: 'Coast',
    type: 'Wholesale',
    coordinates: { lat: -4.0435, lon: 39.6682 },
    commodities: ['Maize', 'Rice', 'Coconut', 'Fish', 'Cassava', 'Mangoes'],
    operatingHours: '05:00-19:00',
    contact: '+254 700 000 002',
    website: 'https://mombasa.go.ke/markets',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'market_003',
    name: 'Kisumu Market',
    county: 'Kisumu',
    region: 'Nyanza',
    type: 'Wholesale',
    coordinates: { lat: -0.0917, lon: 34.7679 },
    commodities: ['Maize', 'Beans', 'Rice', 'Fish', 'Tomatoes', 'Onions'],
    operatingHours: '06:00-18:00',
    contact: '+254 700 000 003',
    website: 'https://kisumu.go.ke/markets',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'market_004',
    name: 'Nakuru Market',
    county: 'Nakuru',
    region: 'Rift Valley',
    type: 'Wholesale',
    coordinates: { lat: -0.3031, lon: 36.0800 },
    commodities: ['Maize', 'Wheat', 'Potatoes', 'Vegetables', 'Fruits'],
    operatingHours: '06:00-18:00',
    contact: '+254 700 000 004',
    website: 'https://nakuru.go.ke/markets',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'market_005',
    name: 'Eldoret Market',
    county: 'Uasin Gishu',
    region: 'Rift Valley',
    type: 'Wholesale',
    coordinates: { lat: 0.5143, lon: 35.2698 },
    commodities: ['Maize', 'Wheat', 'Dairy', 'Beef', 'Vegetables'],
    operatingHours: '06:00-18:00',
    contact: '+254 700 000 005',
    website: 'https://uasingishu.go.ke/markets',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'market_006',
    name: 'Thika Market',
    county: 'Kiambu',
    region: 'Central',
    type: 'Wholesale',
    coordinates: { lat: -1.0369, lon: 37.0726 },
    commodities: ['Pineapples', 'Bananas', 'Tomatoes', 'Onions', 'Cabbage'],
    operatingHours: '06:00-18:00',
    contact: '+254 700 000 006',
    website: 'https://kiambu.go.ke/markets',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'market_007',
    name: 'Kitale Market',
    county: 'Trans Nzoia',
    region: 'Rift Valley',
    type: 'Wholesale',
    coordinates: { lat: 1.0117, lon: 34.9878 },
    commodities: ['Maize', 'Wheat', 'Beans', 'Dairy', 'Vegetables'],
    operatingHours: '06:00-18:00',
    contact: '+254 700 000 007',
    website: 'https://transnzoia.go.ke/markets',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'market_008',
    name: 'Garissa Market',
    county: 'Garissa',
    region: 'North Eastern',
    type: 'Wholesale',
    coordinates: { lat: -0.4538, lon: 39.6464 },
    commodities: ['Maize', 'Rice', 'Livestock', 'Dates', 'Camel Milk'],
    operatingHours: '06:00-18:00',
    contact: '+254 700 000 008',
    website: 'https://garissa.go.ke/markets',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'market_009',
    name: 'Kakamega Market',
    county: 'Kakamega',
    region: 'Western',
    type: 'Wholesale',
    coordinates: { lat: 0.2864, lon: 34.7500 },
    commodities: ['Maize', 'Beans', 'Sugar', 'Tea', 'Vegetables'],
    operatingHours: '06:00-18:00',
    contact: '+254 700 000 009',
    website: 'https://kakamega.go.ke/markets',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'market_010',
    name: 'Machakos Market',
    county: 'Machakos',
    region: 'Eastern',
    type: 'Wholesale',
    coordinates: { lat: -1.5214, lon: 37.2654 },
    commodities: ['Maize', 'Beans', 'Fruits', 'Vegetables', 'Dairy'],
    operatingHours: '06:00-18:00',
    contact: '+254 700 000 010',
    website: 'https://machakos.go.ke/markets',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Query schema
const MarketQuerySchema = z.object({
  county: z.string().optional(),
  region: z.string().optional(),
  type: z.string().optional(),
  commodity: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  page: z.number().min(1).default(1),
});

export const marketRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all markets
  fastify.get('/markets', {
    schema: {
      querystring: MarketQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                markets: { type: 'array', items: MarketSchema },
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
                cached: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const query = MarketQuerySchema.parse(request.query);
      const cacheKey = `market:markets:${JSON.stringify(query)}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.debug('Cache hit for markets', { cacheKey });
        return {
          success: true,
          data: cachedData,
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString(),
            cached: true,
          },
        };
      }

      // Filter markets based on query
      let markets = [...KENYAN_MARKETS];

      if (query.county) {
        markets = markets.filter((m) => m.county.toLowerCase().includes(query.county!.toLowerCase()));
      }

      if (query.region) {
        markets = markets.filter((m) => m.region.toLowerCase().includes(query.region!.toLowerCase()));
      }

      if (query.type) {
        markets = markets.filter((m) => m.type.toLowerCase().includes(query.type!.toLowerCase()));
      }

      if (query.commodity) {
        markets = markets.filter((m) => 
          m.commodities.some((c: string) => 
            c.toLowerCase().includes(query.commodity!.toLowerCase())
          )
        );
      }

      if (query.search) {
        const searchLower = query.search.toLowerCase();
        markets = markets.filter(
          (m) =>
            m.name.toLowerCase().includes(searchLower) ||
            m.county.toLowerCase().includes(searchLower) ||
            m.region.toLowerCase().includes(searchLower) ||
            m.commodities.some((c: string) => c.toLowerCase().includes(searchLower))
        );
      }

      // Pagination
      const total = markets.length;
      const totalPages = Math.ceil(total / query.limit);
      const paginatedMarkets = markets.slice(
        (query.page - 1) * query.limit,
        query.page * query.limit
      );

      const result = {
        markets: paginatedMarkets,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
        },
      };

      // Cache the result
      await cache.set(cacheKey, result, config.cacheTtl.markets);

      return {
        success: true,
        data: result,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
          cached: false,
        },
      };
    },
  });

  // Get specific market by ID
  fastify.get('/markets/:id', {
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
                market: MarketSchema,
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
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const cacheKey = `market:markets:${id}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.debug('Cache hit for market', { cacheKey });
        return {
          success: true,
          data: { market: cachedData },
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Find market
      const market = KENYAN_MARKETS.find((m) => m.id === id);

      if (!market) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Market not found',
          },
        });
      }

      // Cache the result
      await cache.set(cacheKey, market, config.cacheTtl.markets);

      return {
        success: true,
        data: { market },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });

  // Get markets by commodity
  fastify.get('/markets/commodity/:commodity', {
    schema: {
      params: z.object({
        commodity: z.string(),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                commodity: { type: 'string' },
                markets: { type: 'array', items: MarketSchema },
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
      const { commodity } = request.params as { commodity: string };
      const cacheKey = `market:markets:commodity:${commodity}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.debug('Cache hit for commodity markets', { cacheKey });
        return {
          success: true,
          data: cachedData,
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Filter markets by commodity
      const markets = KENYAN_MARKETS.filter((m) =>
        m.commodities.some((c: string) =>
          c.toLowerCase() === commodity.toLowerCase()
        )
      );

      const result = {
        commodity,
        markets,
      };

      // Cache the result
      await cache.set(cacheKey, result, config.cacheTtl.markets);

      return {
        success: true,
        data: result,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    },
  });
};
