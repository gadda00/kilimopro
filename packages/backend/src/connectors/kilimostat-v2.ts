/**
 * KilimoSTAT API Connector — Real API Integration
 * 
 * Based on the KilimoSTAT Swagger API documentation at:
 * https://statistics.kilimo.go.ke/api/swagger/
 * 
 * This connector implements the actual API endpoints documented by Kenya's
 * Ministry of Agriculture & Livestock Development.
 */

const KILIMOSTAT_API_BASE = process.env.KILIMOSTAT_BASE_URL || 'https://statistics.kilimo.go.ke/api';

// Cache configuration
const CACHE_TTL = {
  CROP_PRODUCTION: 86400000,      // 24 hours
  LIVESTOCK: 86400000,             // 24 hours
  MARKET_PRICES: 3600000,          // 1 hour
  FOOD_SECURITY: 86400000,         // 24 hours
  CLIMATE: 86400000,               // 24 hours
  FISHERIES: 86400000,             // 24 hours
};

export interface KilimoSTATCrop {
  commodity: string;
  county: string;
  area_ha: number;
  production_t: number;
  yield_t_ha: number;
  year: number;
}

export interface KilimoSTATMarket {
  market: string;
  county: string;
  commodity: string;
  unit: string;
  price: number;
  date: string;
}

export interface KilimoSTATLivestock {
  type: string;
  county: string;
  population: number;
  production: number;
  unit: string;
  year: number;
}

export class KilimoSTATConnector {
  private apiKey: string;
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  /**
   * Get crop production data by county
   * Endpoint: GET /api/crops/production
   */
  async getCropProduction(params?: {
    county?: string;
    commodity?: string;
    year?: number;
  }): Promise<KilimoSTATCrop[]> {
    const queryParams = new URLSearchParams();
    if (params?.county) queryParams.append('county', params.county);
    if (params?.commodity) queryParams.append('commodity', params.commodity);
    if (params?.year) queryParams.append('year', params.year.toString());

    return this.fetchWithCache<KilimoSTATCrop[]>(
      `${KILIMOSTAT_API_BASE}/crops/production?${queryParams}`,
      `crop_prod_${params?.county || 'all'}_${params?.commodity || 'all'}_${params?.year || 'latest'}`,
      CACHE_TTL.CROP_PRODUCTION,
    );
  }

  /**
   * Get livestock statistics
   * Endpoint: GET /api/livestock
   */
  async getLivestockStats(params?: {
    county?: string;
    type?: string;
  }): Promise<KilimoSTATLivestock[]> {
    const queryParams = new URLSearchParams();
    if (params?.county) queryParams.append('county', params.county);
    if (params?.type) queryParams.append('type', params.type);

    return this.fetchWithCache<KilimoSTATLivestock[]>(
      `${KILIMOSTAT_API_BASE}/livestock?${queryParams}`,
      `livestock_${params?.county || 'all'}_${params?.type || 'all'}`,
      CACHE_TTL.LIVESTOCK,
    );
  }

  /**
   * Get market prices
   * Endpoint: GET /api/market-prices
   */
  async getMarketPrices(params?: {
    commodity?: string;
    market?: string;
    county?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<KilimoSTATMarket[]> {
    const queryParams = new URLSearchParams();
    if (params?.commodity) queryParams.append('commodity', params.commodity);
    if (params?.market) queryParams.append('market', params.market);
    if (params?.county) queryParams.append('county', params.county);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    return this.fetchWithCache<KilimoSTATMarket[]>(
      `${KILIMOSTAT_API_BASE}/market-prices?${queryParams}`,
      `market_${params?.commodity || 'all'}_${params?.market || 'all'}_${Date.now()}`,
      CACHE_TTL.MARKET_PRICES,
    );
  }

  /**
   * Get food security indicators
   * Endpoint: GET /api/food-security
   */
  async getFoodSecurityIndicators(): Promise<any> {
    return this.fetchWithCache(
      `${KILIMOSTAT_API_BASE}/food-security`,
      'food_security',
      CACHE_TTL.FOOD_SECURITY,
    );
  }

  /**
   * Get climate change indicators
   * Endpoint: GET /api/climate
   */
  async getClimateIndicators(): Promise<any> {
    return this.fetchWithCache(
      `${KILIMOSTAT_API_BASE}/climate`,
      'climate_indicators',
      CACHE_TTL.CLIMATE,
    );
  }

  /**
   * Get fisheries data
   * Endpoint: GET /api/fisheries
   */
  async getFisheriesData(params?: { county?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.county) queryParams.append('county', params.county);

    return this.fetchWithCache(
      `${KILIMOSTAT_API_BASE}/fisheries?${queryParams}`,
      `fisheries_${params?.county || 'all'}`,
      CACHE_TTL.FISHERIES,
    );
  }

  /**
   * Get agroforestry data
   * Endpoint: GET /api/agroforestry
   */
  async getAgroforestryData(): Promise<any> {
    return this.fetchWithCache(
      `${KILIMOSTAT_API_BASE}/agroforestry`,
      'agroforestry',
      CACHE_TTL.CROP_PRODUCTION,
    );
  }

  /**
   * Get available counties
   * Endpoint: GET /api/counties
   */
  async getCounties(): Promise<string[]> {
    return this.fetchWithCache(
      `${KILIMOSTAT_API_BASE}/counties`,
      'counties',
      CACHE_TTL.CROP_PRODUCTION,
    );
  }

  /**
   * Get available commodities
   * Endpoint: GET /api/commodities
   */
  async getCommodities(): Promise<string[]> {
    return this.fetchWithCache(
      `${KILIMOSTAT_API_BASE}/commodities`,
      'commodities',
      CACHE_TTL.CROP_PRODUCTION,
    );
  }

  /**
   * Fetch with caching and fallback
   */
  private async fetchWithCache<T>(url: string, cacheKey: string, ttl: number): Promise<T> {
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }

    try {
      const headers: Record<string, string> = {};
      if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`KilimoSTAT API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, expiresAt: Date.now() + ttl });
      return data as T;
    } catch (error) {
      console.error(`[KilimoSTAT] Failed to fetch ${url}:`, error);
      
      // Return cached data even if expired (stale cache is better than no data)
      const stale = this.cache.get(cacheKey);
      if (stale) return stale.data as T;
      
      // Return empty array for list endpoints
      return [] as unknown as T;
    }
  }
}

export const kilimostat = new KilimoSTATConnector(process.env.KILIMOSTAT_API_KEY);
