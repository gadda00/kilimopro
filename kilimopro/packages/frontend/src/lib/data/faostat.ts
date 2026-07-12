/**
 * KilimoPRO 2.0 — FAOSTAT Integration
 *
 * Fetches agricultural data from the UN Food and Agriculture Organization's
 * statistical database (FAOSTAT). Covers production, prices, trade, land use,
 * fertilizers, and pesticides for all 8 IGAD countries.
 *
 * FAOSTAT API: https://fenixservices.fao.org/faostat/api/v1
 * Bulk downloads: https://bulks-faostat.fao.org
 *
 * Free, no API key required. Rate limit: be reasonable (~1 req/sec).
 */

import { IGAD } from './constants';

const FAOSTAT_API = 'https://fenixservices.fao.org/faostat/api/v1/en';
const FAOSTAT_BULK_API = 'https://bulks-faostat.fao.org';

export const FAOSTAT_DOMAINS = {
  PRODUCTION: 'QCL',       // Crop and livestock production
  PRICES: 'PP',            // Producer prices
  TRADE: 'TP',             // Trade (imports/exports)
  LANDUSE: 'RL',           // Land use
  FERTILIZERS: 'RFN',     // Fertilizers by nutrient
  PESTICIDES: 'RP',        // Pesticides
  FOOD_BALANCE: 'FBS',     // Food balance sheets
} as const;

export const FAOSTAT_ELEMENTS = {
  PRODUCTION: '5510',      // Production quantity
  AREA: '5312',            // Area harvested
  YIELD: '5419',           // Yield
  PRICE: '5553',           // Producer price
  EXPORT_QTY: '5910',      // Export quantity
  IMPORT_QTY: '5911',      // Import quantity
  EXPORT_VAL: '5922',      // Export value
  IMPORT_VAL: '5921',      // Import value
} as const;

export interface MarketPriceData {
  countryCode: string;
  country: string;
  cropCode: string;
  crop: string;
  year: number;
  price: number;
  unit: string;
  currency: string;
  source: 'FAOSTAT';
  date: string;
  isVerified: boolean;
  createdAt: string;
}

export interface ProductionData {
  countryCode: string;
  country: string;
  cropCode: string;
  crop: string;
  year: number;
  production: number;    // tonnes
  area: number;          // hectares
  yield: number;         // kg/ha
  unit: string;
  source: 'FAOSTAT';
  date: string;
}

export interface PriceHistoryPoint {
  year: number;
  price: number;
  unit: string;
}

// ─── Fetch market prices from FAOSTAT ────────────────────────────────────────
export async function fetchFAOMarketPrices(
  countryCode: string,
  cropCode?: string,
  year?: number,
): Promise<MarketPriceData[]> {
  const currentYear = year || new Date().getFullYear();
  const country = IGAD.COUNTRIES[countryCode.toUpperCase() as keyof typeof IGAD.COUNTRIES];
  if (!country) {
    console.error(`Invalid country code: ${countryCode}`);
    return [];
  }

  try {
    const params = new URLSearchParams({
      area: country.faoCode,
      year: String(currentYear),
      format: 'json',
    });

    if (cropCode) {
      params.set('item', cropCode);
    } else {
      params.set('item', Object.values(IGAD.CROPS).map(c => c.faoCode).join(','));
    }

    const response = await fetch(
      `${FAOSTAT_API}/data/${FAOSTAT_DOMAINS.PRICES}?${params}`,
      { signal: AbortSignal.timeout(15000) },
    );

    if (!response.ok) {
      console.error(`FAOSTAT prices HTTP ${response.status} for ${countryCode}`);
      return [];
    }

    const data = await response.json();
    if (!data?.data) return [];

    const currency = IGAD.CURRENCIES[countryCode.toUpperCase() as keyof typeof IGAD.CURRENCIES] || 'USD';

    return data.data.map((item: any) => ({
      countryCode: countryCode.toUpperCase(),
      country: country.name,
      cropCode: String(item.item),
      crop: Object.values(IGAD.CROPS).find(c => c.faoCode === String(item.item))?.name || item.item,
      year: parseInt(item.year),
      price: parseFloat(item.value) || 0,
      unit: item.unit || 'USD/tonne',
      currency,
      source: 'FAOSTAT' as const,
      date: new Date(parseInt(item.year), 0, 1).toISOString(),
      isVerified: true,
      createdAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('FAOSTAT Market Prices Error:', error);
    return [];
  }
}

// ─── Fetch production data from FAOSTAT ──────────────────────────────────────
export async function fetchFAOProduction(
  countryCode: string,
  cropCode?: string,
  year?: number,
): Promise<ProductionData[]> {
  const currentYear = year || new Date().getFullYear();
  const country = IGAD.COUNTRIES[countryCode.toUpperCase() as keyof typeof IGAD.COUNTRIES];
  if (!country) return [];

  try {
    const params = new URLSearchParams({
      area: country.faoCode,
      year: String(currentYear),
      format: 'json',
    });

    if (cropCode) {
      params.set('item', cropCode);
    } else {
      params.set('item', Object.values(IGAD.CROPS).map(c => c.faoCode).join(','));
    }

    const response = await fetch(
      `${FAOSTAT_API}/data/${FAOSTAT_DOMAINS.PRODUCTION}?${params}`,
      { signal: AbortSignal.timeout(15000) },
    );

    if (!response.ok) return [];
    const data = await response.json();
    if (!data?.data) return [];

    return data.data.map((item: any) => ({
      countryCode: countryCode.toUpperCase(),
      country: country.name,
      cropCode: String(item.item),
      crop: Object.values(IGAD.CROPS).find(c => c.faoCode === String(item.item))?.name || item.item,
      year: parseInt(item.year),
      production: parseFloat(item.value) || 0,
      area: parseFloat(item.area) || 0,
      yield: parseFloat(item.yield) || 0,
      unit: item.unit || 'tonnes',
      source: 'FAOSTAT' as const,
      date: new Date(parseInt(item.year), 0, 1).toISOString(),
    }));
  } catch (error) {
    console.error('FAOSTAT Production Error:', error);
    return [];
  }
}

// ─── Fetch historical price trends ───────────────────────────────────────────
export async function fetchFAOPriceHistory(
  countryCode: string,
  cropCode: string,
  years: number = 5,
): Promise<PriceHistoryPoint[]> {
  const country = IGAD.COUNTRIES[countryCode.toUpperCase() as keyof typeof IGAD.COUNTRIES];
  if (!country) return [];

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - years + 1;

  try {
    const yearRange = Array.from({ length: years }, (_, i) => startYear + i).join(',');
    const response = await fetch(
      `${FAOSTAT_API}/data/${FAOSTAT_DOMAINS.PRICES}?area=${country.faoCode}&item=${cropCode}&year=${yearRange}&format=json`,
      { signal: AbortSignal.timeout(15000) },
    );

    if (!response.ok) return [];
    const data = await response.json();
    if (!data?.data) return [];

    return data.data
      .map((item: any) => ({
        year: parseInt(item.year),
        price: parseFloat(item.value) || 0,
        unit: item.unit || 'USD/tonne',
      }))
      .sort((a: PriceHistoryPoint, b: PriceHistoryPoint) => a.year - b.year);
  } catch (error) {
    console.error('FAOSTAT Price History Error:', error);
    return [];
  }
}
