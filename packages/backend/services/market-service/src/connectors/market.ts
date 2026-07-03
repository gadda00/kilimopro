/**
 * Market Data Connectors
 * Fetches market data from various sources
 */

import axios from 'axios';
import { getLogger } from '@kilimopro/logger';
import { config } from '../config/index.js';

const logger = getLogger('market-service:connectors');

// AIRC (Agricultural Information and Resource Centre) connector
export async function fetchFromAIRC(query: any): Promise<any[] | null> {
  try {
    const { commodity, market, county, startDate, endDate, limit } = query;

    // Build query parameters
    const params: Record<string, any> = {
      api_key: config.externalApis.airc.apiKey,
      limit: limit || 100,
    };

    if (commodity) params.commodity = commodity;
    if (market) params.market = market;
    if (county) params.county = county;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    logger.debug('Fetching from AIRC', { params });

    const response = await axios.get(`${config.externalApis.airc.baseUrl}/prices`, {
      params,
      timeout: 10000,
    });

    if (response.data && response.data.success && response.data.data) {
      logger.info('Successfully fetched from AIRC', {
        count: response.data.data.length,
      });
      return response.data.data;
    }

    logger.warn('No data from AIRC', { response: response.data });
    return null;
  } catch (error) {
    logger.error('Failed to fetch from AIRC', {
      error: error as Error,
      url: `${config.externalApis.airc.baseUrl}/prices`,
    });
    return null;
  }
}

// FAOSTAT connector
export async function fetchFromFAOSTAT(query: any): Promise<any[] | null> {
  try {
    const { commodity, startDate, endDate, limit } = query;

    // FAOSTAT uses different parameter names
    const params: Record<string, any> = {
      api_key: config.externalApis.faostat.apiKey,
      limit: limit || 100,
    };

    if (commodity) params.item = commodity;
    if (startDate) params.start = startDate.substring(0, 10); // YYYY-MM-DD
    if (endDate) params.end = endDate.substring(0, 10);

    // FAOSTAT doesn't have Kenya-specific market data, so we need to filter
    params.country = 'Kenya';

    logger.debug('Fetching from FAOSTAT', { params });

    const response = await axios.get(`${config.externalApis.faostat.baseUrl}/data`, {
      params,
      timeout: 15000,
    });

    if (response.data && response.data.data) {
      // Transform FAOSTAT data to our format
      const transformedData = transformFAOSTATData(response.data.data);
      logger.info('Successfully fetched from FAOSTAT', {
        count: transformedData.length,
      });
      return transformedData;
    }

    logger.warn('No data from FAOSTAT', { response: response.data });
    return null;
  } catch (error) {
    logger.error('Failed to fetch from FAOSTAT', {
      error: error as Error,
      url: `${config.externalApis.faostat.baseUrl}/data`,
    });
    return null;
  }
}

// Transform FAOSTAT data to our format
function transformFAOSTATData(data: any[]): any[] {
  return data.map((item: any) => ({
    id: `faostat_${item.Year}_${item.Item}_${item.Element}`,
    commodity: item.Item || item.Commodity,
    market: 'National Average', // FAOSTAT doesn't have market-level data
    county: 'Kenya',
    price: parseFloat(item.Value) || 0,
    unit: item.Unit || 'KES/kg',
    date: new Date(item.Year, 0, 1).toISOString(), // Use January 1st of the year
    source: 'faostat',
    quality: 'National Average',
    supply: 'N/A',
    demand: 'N/A',
    metadata: {
      faostat: {
        year: item.Year,
        element: item.Element,
        domain: item.Domain,
      },
    },
  }));
}

// Crowdsourced data connector (placeholder for future implementation)
export async function fetchFromCrowdsource(query: any): Promise<any[] | null> {
  try {
    // This would connect to a crowdsourcing platform
    // For now, return null to use other sources
    logger.debug('Crowdsourced data connector not yet implemented');
    return null;
  } catch (error) {
    logger.error('Failed to fetch from crowdsource', {
      error: error as Error,
    });
    return null;
  }
}

// Combined fetch function that tries all sources
export async function fetchMarketPrices(query: any): Promise<{ data: any[]; source: string }> {
  // Try AIRC first (Kenyan data)
  const aircData = await fetchFromAIRC(query);
  if (aircData && aircData.length > 0) {
    return { data: aircData, source: 'airc' };
  }

  // Try FAOSTAT (international data)
  const faostatData = await fetchFromFAOSTAT(query);
  if (faostatData && faostatData.length > 0) {
    return { data: faostatData, source: 'faostat' };
  }

  // Try crowdsourced data
  const crowdData = await fetchFromCrowdsource(query);
  if (crowdData && crowdData.length > 0) {
    return { data: crowdData, source: 'crowdsource' };
  }

  // Return empty array if no data found
  return { data: [], source: 'none' };
}
