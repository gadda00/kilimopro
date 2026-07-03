/**
 * Market Prices Routes
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { MarketPriceQuerySchema, MarketPriceSchema } from '@kilimopro/shared-types';
import { config } from '../config/index.js';
import { fetchFromAIRC, fetchFromFAOSTAT } from '../connectors/market.js';

const logger = getLogger('market-service:prices');
const cache = getCacheClient('market-service');

// Request query schema
const PriceQuerySchema = z.object({
  commodity: z.string().optional(),
  market: z.string().optional(),
  county: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(1000).default(100),
  page: z.number().min(1).default(1),
});

export const priceRoutes: FastifyPluginAsync = async (fastify) => {
  // Get current market prices
  fastify.get('/prices', {
    schema: {
      querystring: PriceQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                prices: { type: 'array', items: MarketPriceSchema },
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
                source: { type: 'string' },
                cached: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const query = PriceQuerySchema.parse(request.query);
      const cacheKey = `market:prices:${JSON.stringify(query)}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.debug('Cache hit for prices', { cacheKey });
        return {
          success: true,
          data: cachedData,
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString(),
            source: 'cache',
            cached: true,
          },
        };
      }

      // Fetch from data sources
      let prices: any[] = [];
      let source = 'synthetic';

      try {
        // Try AIRC first
        const aircPrices = await fetchFromAIRC(query);
        if (aircPrices && aircPrices.length > 0) {
          prices = aircPrices;
          source = 'airc';
        } else {
          // Fallback to FAOSTAT
          const faostatPrices = await fetchFromFAOSTAT(query);
          if (faostatPrices && faostatPrices.length > 0) {
            prices = faostatPrices;
            source = 'faostat';
          } else {
            // Generate synthetic data for development
            prices = generateSyntheticPrices(query);
            source = 'synthetic';
          }
        }
      } catch (error) {
        logger.error('Failed to fetch prices from external sources', { error: error as Error });
        // Generate synthetic data as fallback
        prices = generateSyntheticPrices(query);
        source = 'synthetic';
      }

      // Cache the result
      await cache.set(cacheKey, { prices, source }, config.cacheTtl.prices);

      // Pagination
      const total = prices.length;
      const totalPages = Math.ceil(total / query.limit);
      const paginatedPrices = prices.slice(
        (query.page - 1) * query.limit,
        query.page * query.limit
      );

      return {
        success: true,
        data: {
          prices: paginatedPrices,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages,
          },
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
          source,
          cached: false,
        },
      };
    },
  });

  // Get price for specific commodity
  fastify.get('/prices/:commodity', {
    schema: {
      params: z.object({
        commodity: z.string(),
      }),
      querystring: z.object({
        market: z.string().optional(),
        county: z.string().optional(),
        days: z.number().min(1).max(365).default(7),
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
                prices: { type: 'array', items: MarketPriceSchema },
                statistics: {
                  type: 'object',
                  properties: {
                    avg: { type: 'number' },
                    min: { type: 'number' },
                    max: { type: 'number' },
                    trend: { type: 'string' },
                  },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
                source: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { commodity } = request.params as { commodity: string };
      const { market, county, days } = request.query as {
        market?: string;
        county?: string;
        days?: number;
      };

      const cacheKey = `market:prices:${commodity}:${market}:${county}:${days}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.debug('Cache hit for commodity prices', { cacheKey });
        return {
          success: true,
          data: cachedData,
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString(),
            source: 'cache',
          },
        };
      }

      // Fetch data
      const query = { commodity, market, county, days };
      let prices: any[] = [];
      let source = 'synthetic';

      try {
        const aircPrices = await fetchFromAIRC(query);
        if (aircPrices && aircPrices.length > 0) {
          prices = aircPrices;
          source = 'airc';
        } else {
          const faostatPrices = await fetchFromFAOSTAT(query);
          if (faostatPrices && faostatPrices.length > 0) {
            prices = faostatPrices;
            source = 'faostat';
          } else {
            prices = generateSyntheticPrices(query);
            source = 'synthetic';
          }
        }
      } catch (error) {
        logger.error('Failed to fetch commodity prices', { error: error as Error });
        prices = generateSyntheticPrices(query);
        source = 'synthetic';
      }

      // Calculate statistics
      const statistics = calculateStatistics(prices);

      // Cache the result
      const result = {
        commodity,
        prices,
        statistics,
      };
      await cache.set(cacheKey, result, config.cacheTtl.prices);

      return {
        success: true,
        data: result,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
          source,
        },
      };
    },
  });
};

// Helper functions
function generateSyntheticPrices(query: any): any[] {
  const commodities = ['Maize', 'Beans', 'Rice', 'Wheat', 'Potatoes', 'Tomatoes', 'Onions', 'Cabbage'];
  const markets = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Kitale', 'Garissa'];
  const counties = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu', 'Kiambu', 'Machakos', 'Kakamega'];

  const commodity = query.commodity || commodities[Math.floor(Math.random() * commodities.length)];
  const market = query.market || markets[Math.floor(Math.random() * markets.length)];
  const county = query.county || counties[Math.floor(Math.random() * counties.length)];
  const limit = query.limit || 100;

  const prices: any[] = [];
  const now = new Date();

  for (let i = 0; i < limit; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    prices.push({
      id: `price_${Date.now()}_${i}`,
      commodity,
      market,
      county,
      price: Math.round(20 + Math.random() * 180), // KES 20-200
      unit: 'KES/kg',
      date: date.toISOString(),
      source: 'synthetic',
      quality: ['Grade A', 'Grade B', 'Grade C'][Math.floor(Math.random() * 3)],
      supply: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
      demand: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
    });
  }

  return prices;
}

function calculateStatistics(prices: any[]): any {
  if (prices.length === 0) {
    return {
      avg: 0,
      min: 0,
      max: 0,
      trend: 'stable',
    };
  }

  const priceValues = prices.map((p: any) => p.price);
  const avg = priceValues.reduce((a: number, b: number) => a + b, 0) / priceValues.length;
  const min = Math.min(...priceValues);
  const max = Math.max(...priceValues);

  // Simple trend calculation
  const recentPrices = priceValues.slice(0, 7);
  const olderPrices = priceValues.slice(7, 14);
  const recentAvg = recentPrices.reduce((a: number, b: number) => a + b, 0) / recentPrices.length;
  const olderAvg = olderPrices.reduce((a: number, b: number) => a + b, 0) / olderPrices.length;

  let trend = 'stable';
  if (recentAvg > olderAvg * 1.05) trend = 'increasing';
  else if (recentAvg < olderAvg * 0.95) trend = 'decreasing';

  return {
    avg: Math.round(avg * 100) / 100,
    min,
    max,
    trend,
  };
}
