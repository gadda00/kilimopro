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
  marketId: z.string().optional(),
  market: z.string(),
  commodity: z.string(),
  category: z.nativeEnum(CommodityCategory).optional(),
  unit: z.string().default('KES/kg'),
  price: z.number().positive(),
  currency: z.string().default('KES'),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  averagePrice: z.number().positive().optional(),
  quantity: z.number().nonnegative().optional(),
  quality: z.string().optional(),
  supply: z.string().optional(),
  demand: z.string().optional(),
  source: z.string(),
  reportedBy: z.string().optional(),
  verified: z.boolean().default(false),
  location: Coordinates.optional(),
  date: z.string().datetime(),
  reportedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type MarketPrice = z.infer<typeof MarketPriceSchema>;

// Market information
export const MarketSchema = z.object({
  id: z.string(),
  name: z.string(),
  county: z.string(),
  region: z.string(),
  type: z.enum(['wholesale', 'retail', 'farmers_market', 'cooperative', 'online']),
  coordinates: Coordinates,
  commodities: z.array(z.string()),
  operatingHours: z.string().optional(),
  contact: z.string().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
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
  id: z.string(),
  commodity: z.string(),
  market: z.string(),
  county: z.string().optional(),
  date: z.string().datetime(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  price: z.number(),
  change: z.number(),
  changePercent: z.number(),
  volume: z.number().optional(),
  source: z.string(),
});

export type MarketTrend = z.infer<typeof MarketTrendSchema>;

// Price forecast
export const MarketForecastSchema = z.object({
  id: z.string(),
  commodity: z.string(),
  market: z.string(),
  county: z.string().optional(),
  date: z.string().datetime(),
  forecastPrice: z.number(),
  confidence: z.number().min(0).max(1),
  minPrice: z.number(),
  maxPrice: z.number(),
  method: z.enum(['simple', 'ewma', 'var', 'garch']),
  volatility: z.number().optional(),
  createdAt: z.string().datetime(),
});

export type MarketForecast = z.infer<typeof MarketForecastSchema>;

// Market query parameters
export const MarketPriceQuerySchema = z.object({
  commodity: z.string().optional(),
  market: z.string().optional(),
  county: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(1000).default(100),
  page: z.number().min(1).default(1),
});

export type MarketPriceQuery = z.infer<typeof MarketPriceQuerySchema>;

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
  county: z.string().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional().default('weekly'),
  days: z.number().min(1).max(365).optional().default(30),
});

export type MarketTrendRequest = z.infer<typeof MarketTrendRequestSchema>;

export const PriceForecastRequestSchema = z.object({
  commodity: z.string(),
  market: z.string().optional(),
  county: z.string().optional(),
  horizon: z.number().min(1).max(90).optional().default(14),
  confidenceLevel: z.number().min(0.5).max(0.99).optional().default(0.95),
  method: z.enum(['simple', 'ewma', 'var', 'garch']).optional().default('simple'),
});

export type PriceForecastRequest = z.infer<typeof PriceForecastRequestSchema>;

// Market response types
export const MarketPricesResponseSchema = z.object({
  prices: z.array(MarketPriceSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type MarketPricesResponse = z.infer<typeof MarketPricesResponseSchema>;

export const MarketTrendResponseSchema = z.object({
  trends: z.array(MarketTrendSchema),
  analysis: z.object({
    overallTrend: z.nativeEnum(PriceTrend),
    volatility: z.number(),
    seasonality: z.string(),
    recommendations: z.array(z.string()),
  }),
});

export type MarketTrendResponse = z.infer<typeof MarketTrendResponseSchema>;

export const PriceForecastResponseSchema = z.object({
  forecasts: z.array(MarketForecastSchema),
  statistics: z.object({
    confidence: z.number(),
    riskLevel: z.string(),
    recommendations: z.array(z.string()),
  }),
});

export type PriceForecastResponse = z.infer<typeof PriceForecastResponseSchema>;
