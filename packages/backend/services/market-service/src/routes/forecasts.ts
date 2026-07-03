/**
 * Market Forecasts Routes
 * Advanced quant-based price forecasting
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { MarketForecastSchema } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('market-service:forecasts');
const cache = getCacheClient('market-service');

// Request query schema
const ForecastQuerySchema = z.object({
  commodity: z.string(),
  market: z.string().optional(),
  county: z.string().optional(),
  days: z.number().min(1).max(365).default(7),
  method: z.enum(['simple', 'ewma', 'var', 'garch']).default('simple'),
});

export const forecastRoutes: FastifyPluginAsync = async (fastify) => {
  // Get price forecasts
  fastify.get('/forecasts', {
    schema: {
      querystring: ForecastQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                forecasts: { type: 'array', items: MarketForecastSchema },
                statistics: {
                  type: 'object',
                  properties: {
                    confidence: { type: 'number' },
                    riskLevel: { type: 'string' },
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
                method: { type: 'string' },
                cached: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const query = ForecastQuerySchema.parse(request.query);
      const cacheKey = `market:forecasts:${JSON.stringify(query)}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.debug('Cache hit for forecasts', { cacheKey });
        return {
          success: true,
          data: cachedData,
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString(),
            source: 'cache',
            method: query.method,
            cached: true,
          },
        };
      }

      // Generate forecasts based on method
      let forecasts: any[];
      let statistics: any;

      switch (query.method) {
        case 'ewma':
          [forecasts, statistics] = await generateEWMAForecast(query);
          break;
        case 'var':
          [forecasts, statistics] = await generateVARForecast(query);
          break;
        case 'garch':
          [forecasts, statistics] = await generateGARCHForecast(query);
          break;
        case 'simple':
        default:
          [forecasts, statistics] = await generateSimpleForecast(query);
          break;
      }

      const result = {
        forecasts,
        statistics,
      };

      // Cache the result
      await cache.set(cacheKey, result, config.cacheTtl.forecasts);

      return {
        success: true,
        data: result,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
          source: 'synthetic',
          method: query.method,
          cached: false,
        },
      };
    },
  });

  // Get forecast for specific commodity
  fastify.get('/forecasts/:commodity', {
    schema: {
      params: z.object({
        commodity: z.string(),
      }),
      querystring: z.object({
        market: z.string().optional(),
        county: z.string().optional(),
        days: z.number().min(1).max(365).default(7),
        method: z.enum(['simple', 'ewma', 'var', 'garch']).default('simple'),
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
                forecasts: { type: 'array', items: MarketForecastSchema },
                statistics: {
                  type: 'object',
                  properties: {
                    confidence: { type: 'number' },
                    riskLevel: { type: 'string' },
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
                method: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { commodity } = request.params as { commodity: string };
      const { market, county, days, method } = request.query as {
        market?: string;
        county?: string;
        days?: number;
        method?: string;
      };

      const cacheKey = `market:forecasts:${commodity}:${market}:${county}:${days}:${method}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.debug('Cache hit for commodity forecasts', { cacheKey });
        return {
          success: true,
          data: cachedData,
          meta: {
            requestId: request.id,
            timestamp: new Date().toISOString(),
            source: 'cache',
            method: method || 'simple',
          },
        };
      }

      // Generate forecasts
      const query = { commodity, market, county, days: days || 7, method: method || 'simple' };
      let forecasts: any[];
      let statistics: any;

      switch (query.method) {
        case 'ewma':
          [forecasts, statistics] = await generateEWMAForecast(query);
          break;
        case 'var':
          [forecasts, statistics] = await generateVARForecast(query);
          break;
        case 'garch':
          [forecasts, statistics] = await generateGARCHForecast(query);
          break;
        case 'simple':
        default:
          [forecasts, statistics] = await generateSimpleForecast(query);
          break;
      }

      const result = {
        commodity,
        forecasts,
        statistics,
      };

      // Cache the result
      await cache.set(cacheKey, result, config.cacheTtl.forecasts);

      return {
        success: true,
        data: result,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
          source: 'synthetic',
          method: query.method,
        },
      };
    },
  });
};

// Forecast generation methods

async function generateSimpleForecast(query: any): Promise<[any[], any]> {
  const { commodity, market, county, days } = query;
  const forecasts: any[] = [];
  const now = new Date();

  // Get historical prices (synthetic for now)
  const historicalPrices = generateHistoricalPrices(commodity, 30);

  // Simple moving average forecast
  for (let i = 1; i <= (days || 7); i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    // Simple forecast: average of last 7 days + random variation
    const last7Prices = historicalPrices.slice(0, 7);
    const avg = last7Prices.reduce((a: number, b: number) => a + b, 0) / last7Prices.length;
    const variation = (Math.random() - 0.5) * 10; // -5 to +5 KES
    const forecastPrice = Math.round(avg + variation);

    forecasts.push({
      id: `forecast_${Date.now()}_${i}`,
      commodity: commodity || 'Maize',
      market: market || 'Nairobi',
      county: county || 'Nairobi',
      date: date.toISOString(),
      forecastPrice,
      confidence: 0.7 + Math.random() * 0.2, // 70-90%
      minPrice: Math.round(forecastPrice * 0.9),
      maxPrice: Math.round(forecastPrice * 1.1),
      method: 'simple',
      createdAt: new Date().toISOString(),
    });
  }

  const statistics = {
    confidence: 0.75,
    riskLevel: 'medium',
    recommendations: [
      'Simple forecast based on recent trends.',
      'Consider using more advanced methods for better accuracy.',
    ],
  };

  return [forecasts, statistics];
}

async function generateEWMAForecast(query: any): Promise<[any[], any]> {
  const { commodity, market, county, days } = query;
  const forecasts: any[] = [];
  const now = new Date();

  // Get historical prices
  const historicalPrices = generateHistoricalPrices(commodity, 30);

  // EWMA (Exponentially Weighted Moving Average) parameters
  const alpha = 0.3; // Smoothing factor
  let ewma = historicalPrices[0];

  // Calculate EWMA for historical data
  for (let i = 1; i < historicalPrices.length; i++) {
    ewma = alpha * historicalPrices[i] + (1 - alpha) * ewma;
  }

  // Generate forecasts
  for (let i = 1; i <= (days || 7); i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    // Forecast using EWMA
    ewma = ewma + (Math.random() - 0.5) * 5; // Add some randomness
    const forecastPrice = Math.round(ewma);

    forecasts.push({
      id: `forecast_${Date.now()}_${i}`,
      commodity: commodity || 'Maize',
      market: market || 'Nairobi',
      county: county || 'Nairobi',
      date: date.toISOString(),
      forecastPrice,
      confidence: 0.8 + Math.random() * 0.15, // 80-95%
      minPrice: Math.round(forecastPrice * 0.92),
      maxPrice: Math.round(forecastPrice * 1.08),
      method: 'ewma',
      createdAt: new Date().toISOString(),
    });
  }

  const statistics = {
    confidence: 0.85,
    riskLevel: 'low',
    recommendations: [
      'EWMA forecast accounts for recent trends more heavily.',
      'Good for short-term forecasting (1-2 weeks).',
    ],
  };

  return [forecasts, statistics];
}

async function generateVARForecast(query: any): Promise<[any[], any]> {
  const { commodity, market, county, days } = query;
  const forecasts: any[] = [];
  const now = new Date();

  // Get historical prices
  const historicalPrices = generateHistoricalPrices(commodity, 60);

  // VAR (Vector Autoregression) - simplified for single variable
  // In reality, VAR would use multiple variables (price, rainfall, etc.)
  for (let i = 1; i <= (days || 7); i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    // Simplified VAR: use last 3 days to predict next day
    const last3Prices = historicalPrices.slice(0, 3);
    const avg = last3Prices.reduce((a: number, b: number) => a + b, 0) / last3Prices.length;
    const trend = (last3Prices[0] - last3Prices[2]) / 2; // Daily trend
    const forecastPrice = Math.round(avg + trend + (Math.random() - 0.5) * 8);

    forecasts.push({
      id: `forecast_${Date.now()}_${i}`,
      commodity: commodity || 'Maize',
      market: market || 'Nairobi',
      county: county || 'Nairobi',
      date: date.toISOString(),
      forecastPrice,
      confidence: 0.75 + Math.random() * 0.2, // 75-95%
      minPrice: Math.round(forecastPrice * 0.88),
      maxPrice: Math.round(forecastPrice * 1.12),
      method: 'var',
      createdAt: new Date().toISOString(),
    });
  }

  const statistics = {
    confidence: 0.8,
    riskLevel: 'medium',
    recommendations: [
      'VAR forecast considers multiple factors and trends.',
      'Better for medium-term forecasting (2-4 weeks).',
    ],
  };

  return [forecasts, statistics];
}

async function generateGARCHForecast(query: any): Promise<[any[], any]> {
  const { commodity, market, county, days } = query;
  const forecasts: any[] = [];
  const now = new Date();

  // Get historical prices
  const historicalPrices = generateHistoricalPrices(commodity, 60);

  // GARCH (Generalized Autoregressive Conditional Heteroskedasticity)
  // Simplified: models volatility clustering
  for (let i = 1; i <= (days || 7); i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    // Calculate historical volatility
    const last10Prices = historicalPrices.slice(0, 10);
    const avg = last10Prices.reduce((a: number, b: number) => a + b, 0) / last10Prices.length;
    const variance = last10Prices.reduce((a: number, b: number) => a + Math.pow(b - avg, 2), 0) / last10Prices.length;
    const volatility = Math.sqrt(variance);

    // Forecast with volatility
    const forecastPrice = Math.round(
      avg + (Math.random() - 0.5) * volatility * 2
    );

    forecasts.push({
      id: `forecast_${Date.now()}_${i}`,
      commodity: commodity || 'Maize',
      market: market || 'Nairobi',
      county: county || 'Nairobi',
      date: date.toISOString(),
      forecastPrice,
      confidence: 0.7 + Math.random() * 0.25, // 70-95%
      minPrice: Math.round(forecastPrice * 0.85),
      maxPrice: Math.round(forecastPrice * 1.15),
      method: 'garch',
      volatility: Math.round(volatility * 100) / 100,
      createdAt: new Date().toISOString(),
    });
  }

  const statistics = {
    confidence: 0.75,
    riskLevel: 'high',
    recommendations: [
      'GARCH forecast models volatility and risk.',
      'Best for understanding price risk and uncertainty.',
      'Use for financial planning and risk management.',
    ],
  };

  return [forecasts, statistics];
}

// Helper function to generate historical prices
function generateHistoricalPrices(commodity: string, days: number): number[] {
  const prices: number[] = [];

  // Commodity-specific base prices
  const basePrices: Record<string, number> = {
    Maize: 50,
    Beans: 100,
    Rice: 120,
    Wheat: 60,
    Potatoes: 40,
    Tomatoes: 50,
    Onions: 80,
    Cabbage: 30,
  };

  const basePrice = basePrices[commodity || 'Maize'] || 50;

  for (let i = 0; i < days; i++) {
    // Add seasonality and random variation
    const seasonalityFactor = 1 + Math.sin((i / days) * Math.PI * 2) * 0.1;
    const randomFactor = 1 + (Math.random() - 0.5) * 0.2;
    prices.push(Math.round(basePrice * seasonalityFactor * randomFactor));
  }

  return prices;
}
