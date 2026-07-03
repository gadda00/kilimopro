/**
 * Market-related types
 */

import { z } from 'zod';
import { Location, Coordinates, PaginatedQuery, PaginatedResponse } from './common.js';

// Commodity categories
export enum CommodityCategory {
  GRAINS = 'grains',
  FRUITS = 'fruits',
  VEGETABLES = 'vegetables',
  LIVESTOCK = 'livestock',
  DAIRY = 'dairy',
  POULTRY = 'poultry',
  FISH = 'fish',
  INPUTS = 'inputs',
  EQUIPMENT = 'equipment',
  OTHER = 'other',
}

// Commodity units
export enum CommodityUnit {
  KG = 'kg',
  TONNE = 'tonne',
  BAG = 'bag',
  LITRE = 'litre',
  HEAD = 'head',
  BUNCH = 'bunch',
  CRATE = 'crate',
  SACK = 'sack',
  PIECES = 'pieces',
}

// Market price
export const MarketPriceSchema = z.object({
  id: z.string(),
  marketId: z.string(),
  marketName: z.string(),
  commodityId: z.string(),
  commodity: z.string(),
  category: z.nativeEnum(CommodityCategory),
  unit: z.nativeEnum(CommodityUnit),
  price: z.number().positive(),
  currency: z.string().default('KES'),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  averagePrice: z.number().positive().optional(),
  quantity: z.number().nonnegative().optional(),
  source: z.string(),
  reportedBy: z.string().optional(),
  verified: z.boolean().default(false),
  location: Location,
  reportedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MarketPrice = z.infer<typeof MarketPriceSchema>;

// Market information
export const MarketSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  location: Location,
  type: z.enum(['wholesale', 'retail', 'farmers_market', 'cooperative', 'online']),
  size: z.enum(['small', 'medium', 'large']),
  operatingDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  openingHours: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Market = z.infer<typeof MarketSchema>;

// Price trend
export enum PriceTrend {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  STABLE = 'stable',
  VOLATILE = 'volatile',
}

// Market trend analysis
export const MarketTrendSchema = z.object({
  commodity: z.string(),
  category: z.nativeEnum(CommodityCategory),
  unit: z.nativeEnum(CommodityUnit),
  currentPrice: z.number(),
  previousPrice: z.number(),
  change: z.number(),
  changePercent: z.number(),
  trend: z.nativeEnum(PriceTrend),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  dataPoints: z.number(),
  minPrice: z.number(),
  maxPrice: z.number(),
  averagePrice: z.number(),
  volatility: z.number(),
  forecast: z.array(z.object({
    date: z.string().datetime(),
    predictedPrice: z.number(),
    lowerBound: z.number(),
    upperBound: z.number(),
    confidence: z.number().min(0).max(1),
  })).optional(),
});

export type MarketTrend = z.infer<typeof MarketTrendSchema>;

// Price forecast
export const PriceForecastSchema = z.object({
  commodity: z.string(),
  market: z.string(),
  horizon: z.number(), // days
  forecasts: z.array(z.object({
    date: z.string().datetime(),
    predictedPrice: z.number(),
    lowerBound: z.number(),
    upperBound: z.number(),
    confidence: z.number().min(0).max(1),
  })),
  metrics: z.object({
    ewmaVolatility: z.number(),
    var95: z.number(), // Value at Risk 95%
    var99: z.number(), // Value at Risk 99%
    trend: z.nativeEnum(PriceTrend),
    smaSignal: z.enum(['buy', 'sell', 'hold']),
    rsi: z.number().min(0).max(100),
  }),
  recommendation: z.string(),
  createdAt: z.string().datetime(),
});

export type PriceForecast = z.infer<typeof PriceForecastSchema>;

// Market query parameters
export const MarketQuerySchema = z.object({
  commodity: z.string().optional(),
  category: z.nativeEnum(CommodityCategory).optional(),
  market: z.string().optional(),
  county: z.string().optional(),
  days: z.string().transform(val => parseInt(val)).optional().default('7'),
  page: z.string().transform(val => parseInt(val)).optional().default('1'),
  limit: z.string().transform(val => parseInt(val)).optional().default('20'),
});

export type MarketQuery = z.infer<typeof MarketQuerySchema>;

// Market request types
export const MarketPricesRequestSchema = z.object({
  filters: z.object({
    commodities: z.array(z.string()).optional(),
    categories: z.array(z.nativeEnum(CommodityCategory)).optional(),
    markets: z.array(z.string()).optional(),
    counties: z.array(z.string()).optional(),
    verified: z.boolean().optional(),
  }).optional(),
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
  pagination: PaginatedQuery.optional(),
});

export type MarketPricesRequest = z.infer<typeof MarketPricesRequestSchema>;

export const MarketTrendRequestSchema = z.object({
  commodity: z.string(),
  market: z.string().optional(),
  category: z.nativeEnum(CommodityCategory).optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional().default('weekly'),
  days: z.number().min(1).max(365).optional().default(30),
});

export type MarketTrendRequest = z.infer<typeof MarketTrendRequestSchema>;

export const PriceForecastRequestSchema = z.object({
  commodity: z.string(),
  market: z.string().optional(),
  horizon: z.number().min(1).max(90).optional().default(14),
  confidenceLevel: z.number().min(0.5).max(0.99).optional().default(0.95),
});

export type PriceForecastRequest = z.infer<typeof PriceForecastRequestSchema>;

// Market response types
export const MarketPricesResponseSchema = z.object({
  prices: z.array(MarketPriceSchema),
  pagination: PaginatedResponse<MarketPrice>['pagination'],
});

export type MarketPricesResponse = z.infer<typeof MarketPricesResponseSchema>;

export const MarketTrendResponseSchema = z.object({
  trends: z.array(MarketTrendSchema),
  commodity: z.string(),
  market: z.string().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
});

export type MarketTrendResponse = z.infer<typeof MarketTrendResponseSchema>;

export const PriceForecastResponseSchema = z.object({
  forecast: PriceForecastSchema,
});

export type PriceForecastResponse = z.infer<typeof PriceForecastResponseSchema>;
