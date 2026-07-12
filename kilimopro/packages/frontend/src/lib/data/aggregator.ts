/**
 * KilimoPRO 2.0 — Data Aggregator
 *
 * Central aggregation layer that combines data from all sources:
 *   - FAOSTAT (market prices, production data)
 *   - ICPAC (climate alerts, agriculture watch, forecasts)
 *   - Open-Meteo (weather forecasts — free, no API key)
 *   - World Bank (agricultural indicators)
 *
 * The API routes call DataAggregator methods; DataAggregator handles caching,
 * fallback, and normalization.
 *
 * This is the "single source of truth" for all data in KilimoPRO 2.0.
 */

import { IGAD, getCountryCoordinates } from './constants';
import { fetchFAOMarketPrices, fetchFAOProduction, fetchFAOPriceHistory, type MarketPriceData, type ProductionData } from './faostat';
import { fetchICPACAlerts, fetchICPACAgricultureWatch, fetchICPACClimateForecast, type ICPACAlert, type ICPACAgricultureWatch, type ICPACClimateForecast } from './icpac';
import { fetchWeather, fetchHistoricalWeather, generateWeatherAlerts, type WeatherData, type WeatherAlert } from './openmeteo';
import { fetchAgricultureIndicators, type WorldBankIndicator } from './worldbank';

// ─── In-memory cache (simple TTL-based) ──────────────────────────────────────
interface CacheEntry<T> { data: T; expiresAt: number; }
const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const cached_entry = cache.get(key) as CacheEntry<T> | undefined;
  if (cached_entry && cached_entry.expiresAt > Date.now()) {
    return cached_entry.data;
  }
  const data = await fn();
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

// ─── DataAggregator ──────────────────────────────────────────────────────────

export const DataAggregator = {
  // ─── Market Prices ─────────────────────────────────────────────────────────
  async getMarketPrices(countryCode?: string, crop?: string): Promise<MarketPriceData[]> {
    if (countryCode) {
      return cached(
        `prices:${countryCode}:${crop || 'all'}`,
        6 * 3600 * 1000, // 6 hours
        () => fetchFAOMarketPrices(countryCode, crop),
      );
    }

    // Fetch for all IGAD countries
    const countries = Object.keys(IGAD.COUNTRIES);
    const results = await Promise.all(
      countries.map(c => cached(`prices:${c}:${crop || 'all'}`, 6 * 3600 * 1000, () => fetchFAOMarketPrices(c, crop))),
    );
    return results.flat();
  },

  // ─── Production Data ────────────────────────────────────────────────────────
  async getProduction(countryCode?: string, crop?: string): Promise<ProductionData[]> {
    if (countryCode) {
      return cached(`production:${countryCode}:${crop || 'all'}`, 24 * 3600 * 1000, () =>
        fetchFAOProduction(countryCode, crop),
      );
    }
    const countries = Object.keys(IGAD.COUNTRIES);
    const results = await Promise.all(
      countries.map(c => cached(`production:${c}:${crop || 'all'}`, 24 * 3600 * 1000, () =>
        fetchFAOProduction(c, crop),
      )),
    );
    return results.flat();
  },

  // ─── Price History (for trend analysis) ─────────────────────────────────────
  async getPriceHistory(countryCode: string, cropCode: string, years: number = 5) {
    return cached(`pricehistory:${countryCode}:${cropCode}:${years}`, 24 * 3600 * 1000, () =>
      fetchFAOPriceHistory(countryCode, cropCode, years),
    );
  },

  // ─── Climate Alerts (ICPAC) ────────────────────────────────────────────────
  async getHazardAlerts(countryCode?: string): Promise<ICPACAlert[]> {
    return cached(`alerts:${countryCode || 'all'}`, 60 * 60 * 1000, () => // 1 hour
      fetchICPACAlerts(countryCode),
    );
  },

  // ─── Agriculture Watch (ICPAC) ─────────────────────────────────────────────
  async getAgricultureWatch(): Promise<ICPACAgricultureWatch> {
    return cached('agwatch', 6 * 60 * 60 * 1000, () => // 6 hours
      fetchICPACAgricultureWatch(),
    );
  },

  // ─── Climate Forecast (ICPAC) ──────────────────────────────────────────────
  async getClimateForecast(region?: string): Promise<ICPACClimateForecast[]> {
    return cached(`forecast:${region || 'all'}`, 12 * 60 * 60 * 1000, () => // 12 hours
      fetchICPACClimateForecast(region),
    );
  },

  // ─── Weather (Open-Meteo — free!) ──────────────────────────────────────────
  async getWeather(latitude: number, longitude: number, days: number = 7): Promise<WeatherData> {
    return cached(`weather:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${days}`, 60 * 60 * 1000, () => // 1 hour
      fetchWeather(latitude, longitude, days),
    );
  },

  // ─── Weather by country code ────────────────────────────────────────────────
  async getWeatherByCountry(countryCode: string, days: number = 7): Promise<WeatherData> {
    const [lat, lon] = getCountryCoordinates(countryCode);
    return this.getWeather(lat, lon, days);
  },

  // ─── Weather alerts (derived from forecast) ─────────────────────────────────
  async getWeatherAlerts(latitude: number, longitude: number): Promise<WeatherAlert[]> {
    const weather = await this.getWeather(latitude, longitude, 7);
    return generateWeatherAlerts(weather.forecast);
  },

  // ─── Historical weather ─────────────────────────────────────────────────────
  async getHistoricalWeather(latitude: number, longitude: number, startDate: string, endDate: string) {
    return cached(`histweather:${latitude}:${longitude}:${startDate}:${endDate}`, 7 * 24 * 60 * 60 * 1000, () => // 7 days
      fetchHistoricalWeather(latitude, longitude, startDate, endDate),
    );
  },

  // ─── World Bank indicators ─────────────────────────────────────────────────
  async getAgricultureIndicators(countryCode: string): Promise<WorldBankIndicator[]> {
    return cached(`indicators:${countryCode}`, 7 * 24 * 60 * 60 * 1000, () => // 7 days
      fetchAgricultureIndicators(countryCode),
    );
  },

  // ─── Format prices as CSV (for export) ─────────────────────────────────────
  formatPricesAsCSV(prices: MarketPriceData[]): string {
    if (!prices || prices.length === 0) return 'No data available';
    const headers = ['Country', 'Crop', 'Price', 'Currency', 'Unit', 'Date', 'Source'];
    const rows = prices.map(p => [
      p.country || '',
      p.crop || '',
      p.price || '',
      p.currency || '',
      p.unit || '',
      p.date || '',
      p.source || '',
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  },

  // ─── Format prices as SMS (for feature phone users) ────────────────────────
  formatPricesAsSMS(prices: MarketPriceData[]): string {
    if (!prices || prices.length === 0) return 'No price data available';
    const top3 = prices.slice(0, 3);
    return top3.map(p =>
      `${p.crop}: ${p.price} ${p.currency}/${p.unit} (${p.country})`,
    ).join(' | ');
  },

  // ─── Clear cache ────────────────────────────────────────────────────────────
  clearCache(): void {
    cache.clear();
  },
};
