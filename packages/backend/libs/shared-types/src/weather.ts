/**
 * Weather-related types
 */

import { z } from 'zod';
import { Location, Coordinates } from './common.js';

// Weather data sources
export enum WeatherSource {
  KAOP = 'kaop',
  OPENWEATHER = 'openweather',
  CHIRPS = 'chirps',
  SYNTHETIC = 'synthetic',
  GEE = 'google_earth_engine',
}

// Weather forecast
export const WeatherForecastSchema = z.object({
  date: z.string().datetime(),
  tempMin: z.number(),
  tempMax: z.number(),
  rainfall: z.number().nonnegative(), // mm
  rainfallProbability: z.number().min(0).max(1),
  humidity: z.number().min(0).max(100), // %
  windSpeed: z.number().nonnegative(), // km/h
  windDirection: z.number().min(0).max(360).optional(), // degrees
  cloudCover: z.number().min(0).max(100), // %
  pressure: z.number().optional(), // hPa
  uvIndex: z.number().optional(),
  source: z.nativeEnum(WeatherSource),
  location: Coordinates.optional(),
});

export type WeatherForecast = z.infer<typeof WeatherForecastSchema>;

// Weather alert types
export enum WeatherAlertType {
  FROST = 'frost',
  HEAVY_RAIN = 'heavy_rain',
  DRY_SPELL = 'dry_spell',
  HEAT_WAVE = 'heat_wave',
  STRONG_WIND = 'strong_wind',
  HAIL = 'hail',
  FLOOD = 'flood',
  DROUGHT = 'drought',
}

// Weather alert severity
export enum WeatherAlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

// Weather alert
export const WeatherAlertSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(WeatherAlertType),
  severity: z.nativeEnum(WeatherAlertSeverity),
  message: z.string(),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  affectedAreas: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  source: z.nativeEnum(WeatherSource),
  location: Coordinates,
  createdAt: z.string().datetime(),
});

export type WeatherAlert = z.infer<typeof WeatherAlertSchema>;

// NDVI (Normalized Difference Vegetation Index)
export const NDVISchema = z.object({
  current: z.number().min(-1).max(1),
  historical: z.number().min(-1).max(1),
  anomaly: z.number().min(-2).max(2),
  trend: z.enum(['improving', 'declining', 'stable']),
  location: Coordinates,
  date: z.string().datetime(),
  source: z.string(),
});

export type NDVI = z.infer<typeof NDVISchema>;

// Rainfall data
export const RainfallSchema = z.object({
  date: z.string().datetime(),
  rainfall: z.number().nonnegative(), // mm
  source: z.nativeEnum(WeatherSource),
  location: Coordinates,
});

export type Rainfall = z.infer<typeof RainfallSchema>;

// Weather query parameters
export const WeatherQuerySchema = z.object({
  lat: z.string().transform(val => parseFloat(val)),
  lon: z.string().transform(val => parseFloat(val)),
  days: z.string().transform(val => parseInt(val)).optional().default('7'),
  crops: z.string().optional(),
});

export type WeatherQuery = z.infer<typeof WeatherQuerySchema>;

// Weather forecast request
export const ForecastRequestSchema = z.object({
  location: Coordinates,
  days: z.number().min(1).max(14).optional().default(7),
  hourly: z.boolean().optional().default(false),
});

export type ForecastRequest = z.infer<typeof ForecastRequestSchema>;

// Weather alerts request
export const AlertsRequestSchema = z.object({
  location: Coordinates,
  crops: z.array(z.string()).optional(),
  severity: z.array(z.nativeEnum(WeatherAlertSeverity)).optional(),
  days: z.number().min(1).max(30).optional().default(7),
});

export type AlertsRequest = z.infer<typeof AlertsRequestSchema>;

// NDVI request
export const NDVIRequestSchema = z.object({
  location: Coordinates,
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type NDVIRequest = z.infer<typeof NDVIRequestSchema>;

// Rainfall request
export const RainfallRequestSchema = z.object({
  location: Coordinates,
  days: z.number().min(1).max(365).optional().default(30),
  source: z.nativeEnum(WeatherSource).optional(),
});

export type RainfallRequest = z.infer<typeof RainfallRequestSchema>;

// Weather response types
export const ForecastResponseSchema = z.object({
  forecasts: z.array(WeatherForecastSchema),
  location: Coordinates,
  source: z.nativeEnum(WeatherSource),
  cached: z.boolean().optional(),
  cachedAt: z.string().datetime().optional(),
});

export type ForecastResponse = z.infer<typeof ForecastResponseSchema>;

export const AlertsResponseSchema = z.object({
  alerts: z.array(WeatherAlertSchema),
  count: z.number(),
  location: Coordinates,
});

export type AlertsResponse = z.infer<typeof AlertsResponseSchema>;

export const NDVIResponseSchema = z.object({
  ndvi: NDVISchema,
  location: Coordinates,
});

export type NDVIResponse = z.infer<typeof NDVIResponseSchema>;

export const RainfallResponseSchema = z.object({
  rainfall: z.array(RainfallSchema),
  total: z.number(),
  average: z.number(),
  location: Coordinates,
  days: z.number(),
});

export type RainfallResponse = z.infer<typeof RainfallResponseSchema>;
