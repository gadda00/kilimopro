/**
 * Market Trends Routes
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { MarketTrendSchema } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('market-service:trends');
const cache = getCacheClient('market-service');

// Request query schema
const TrendQuerySchema = z.object({
  commodity: z.string(),
  market: z.string().optional(),
  county: z.string().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('weekly'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const trendRoutes: FastifyPluginAsync = async (fastify) => {
  // Get market trends
  fastify.get('/trends', {
    schema: {
      querystring: TrendQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                trends: { type: 'array', items: MarketTrendSchema },
                analysis: {
                  type: 'object',
                  properties: {
                    overallTrend: { type: 'string' },
                    volatility: { type: 'number' },
                    seasonality: { type: 'string' },
                    recommendations: { type: 'array', items: { type: 'string' } },
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
      const query = TrendQuerySchema.parse(request.query);
      const cacheKey = `market:trends:${JSON.stringify(query)}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.debug('Cache hit for trends', { cacheKey });
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

      // Generate trends (for now, synthetic data)
      const trends = generateSyntheticTrends(query);
      const analysis = analyzeTrends(trends);

      const result = {
        trends,
        analysis,
      };

      // Cache the result
      await cache.set(cacheKey, result, config.cacheTtl.trends);

      return {
        success: true,
        data: result,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
          source: 'synthetic',
          cached: false,
        },
      };
    },
  });

  // Get trend for specific commodity
  fastify.get('/trends/:commodity', {
    schema: {
      params: z.object({
        commodity: z.string(),
      }),
      querystring: z.object({
        market: z.string().optional(),
        county: z.string().optional(),
        period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('weekly'),
        days: z.number().min(30).max(365).default(90),
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
                trends: { type: 'array', items: MarketTrendSchema },
                analysis: {
                  type: 'object',
                  properties: {
                    overallTrend: { type: 'string' },
                    volatility: { type: 'number' },
                    seasonality: { type: 'string' },
                    recommendations: { type: 'array', items: { type: 'string' } },
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
      const { market, county, period, days } = request.query as {
        market?: string;
        county?: string;
        period?: string;
        days?: number;
      };

      const cacheKey = `market:trends:${commodity}:${market}:${county}:${period}:${days}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.debug('Cache hit for commodity trends', { cacheKey });
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

      // Generate trends
      const query = { commodity, market, county, period, days };
      const trends = generateSyntheticTrends(query);
      const analysis = analyzeTrends(trends);

      const result = {
        commodity,
        trends,
        analysis,
      };

      // Cache the result
      await cache.set(cacheKey, result, config.cacheTtl.trends);

      return {
        success: true,
        data: result,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
          source: 'synthetic',
        },
      };
    },
  });
};

// Helper functions
function generateSyntheticTrends(query: any): any[] {
  const { commodity, market, county, period, days } = query;
  const limit = days || 90;

  const trends: any[] = [];
  const now = new Date();

  // Generate base prices with seasonality
  const basePrices = generateSeasonalPrices(commodity, limit);

  for (let i = 0; i < limit; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const price = basePrices[i];
    const previousPrice = i > 0 ? basePrices[i - 1] : price;
    const change = price - previousPrice;
    const changePercent = (change / previousPrice) * 100;

    trends.push({
      id: `trend_${Date.now()}_${i}`,
      commodity: commodity || 'Maize',
      market: market || 'Nairobi',
      county: county || 'Nairobi',
      date: date.toISOString(),
      period,
      price,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(100 + Math.random() * 900), // 100-1000 units
      source: 'synthetic',
    });
  }

  return trends;
}

function generateSeasonalPrices(commodity: string, days: number): number[] {
  const prices: number[] = [];

  // Commodity-specific seasonality patterns
  const patterns: Record<string, (day: number) => number> = {
    Maize: (day) => {
      // Maize prices typically peak during dry seasons (Jan-Mar, Jul-Sep)
      const month = (day % 30) + 1; // Simulate monthly cycle
      let base = 40 + Math.random() * 20; // KES 40-60
      
      // Dry season premium
      if ([1, 2, 3, 7, 8, 9].includes(month)) {
        base *= 1.2 + Math.random() * 0.3;
      }
      
      // Harvest season discount
      if ([4, 5, 10, 11].includes(month)) {
        base *= 0.8 + Math.random() * 0.2;
      }
      
      return Math.round(base);
    },
    Beans: (day) => {
      // Beans have more stable prices
      const base = 80 + Math.random() * 40; // KES 80-120
      return Math.round(base * (0.9 + Math.random() * 0.2));
    },
    Rice: (day) => {
      // Rice prices are relatively stable
      const base = 100 + Math.random() * 30; // KES 100-130
      return Math.round(base);
    },
    Tomatoes: (day) => {
      // Tomatoes are highly seasonal
      const month = (day % 30) + 1;
      let base = 30 + Math.random() * 40; // KES 30-70
      
      // High season (Dec-Feb, Jun-Aug)
      if ([12, 1, 2, 6, 7, 8].includes(month)) {
        base *= 1.5 + Math.random() * 0.5;
      }
      
      // Low season (Mar-May, Sep-Nov)
      if ([3, 4, 5, 9, 10, 11].includes(month)) {
        base *= 0.7 + Math.random() * 0.3;
      }
      
      return Math.round(base);
    },
  };

  const pattern = patterns[commodity] || patterns.Maize;

  for (let i = 0; i < days; i++) {
    prices.push(pattern(i));
  }

  return prices;
}

function analyzeTrends(trends: any[]): any {
  if (trends.length === 0) {
    return {
      overallTrend: 'stable',
      volatility: 0,
      seasonality: 'none',
      recommendations: [],
    };
  }

  // Calculate overall trend
  const firstPrice = trends[0].price;
  const lastPrice = trends[trends.length - 1].price;
  const overallChange = ((lastPrice - firstPrice) / firstPrice) * 100;

  let overallTrend = 'stable';
  if (overallChange > 5) overallTrend = 'increasing';
  else if (overallChange < -5) overallTrend = 'decreasing';

  // Calculate volatility (standard deviation of daily changes)
  const changes = trends.map((t: any) => t.changePercent || 0);
  const avgChange = changes.reduce((a: number, b: number) => a + b, 0) / changes.length;
  const variance = changes.reduce((a: number, b: number) => a + Math.pow(b - avgChange, 2), 0) / changes.length;
  const volatility = Math.sqrt(variance);

  // Detect seasonality
  let seasonality = 'none';
  if (volatility > 15) seasonality = 'high';
  else if (volatility > 5) seasonality = 'medium';

  // Generate recommendations
  const recommendations = generateRecommendations(overallTrend, volatility, trends);

  return {
    overallTrend,
    volatility: Math.round(volatility * 100) / 100,
    seasonality,
    recommendations,
  };
}

function generateRecommendations(trend: string, volatility: number, trends: any[]): string[] {
  const recommendations: string[] = [];

  // Trend-based recommendations
  if (trend === 'increasing') {
    recommendations.push('Prices are rising. Consider selling soon if you have stock.');
    recommendations.push('Monitor market trends closely for optimal selling time.');
  } else if (trend === 'decreasing') {
    recommendations.push('Prices are falling. Consider buying now if you need stock.');
    recommendations.push('Wait for prices to bottom out before making large purchases.');
  } else {
    recommendations.push('Prices are stable. Good time for regular transactions.');
  }

  // Volatility-based recommendations
  if (volatility > 15) {
    recommendations.push('High volatility detected. Consider hedging strategies.');
    recommendations.push('Use limit orders to manage risk.');
  } else if (volatility > 5) {
    recommendations.push('Moderate volatility. Monitor price movements closely.');
  } else {
    recommendations.push('Low volatility. Prices are predictable.');
  }

  // Seasonality-based recommendations
  const latestTrend = trends[0];
  if (latestTrend) {
    const month = new Date(latestTrend.date).getMonth();
    
    // Kenya-specific seasonality
    if ([0, 1, 2].includes(month)) { // Jan-Mar (dry season)
      recommendations.push('Dry season: Expect higher prices for most crops.');
    } else if ([3, 4, 5].includes(month)) { // Apr-Jun (long rains)
      recommendations.push('Long rains season: Expect lower prices as harvests begin.');
    } else if ([9, 10, 11].includes(month)) { // Oct-Dec (short rains)
      recommendations.push('Short rains season: Expect lower prices as harvests begin.');
    } else if ([6, 7, 8].includes(month)) { // Jul-Sep (dry season)
      recommendations.push('Dry season: Expect higher prices for most crops.');
    }
  }

  return recommendations;
}
