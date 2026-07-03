/**
 * FAOSTAT Data Connector
 * Connects to the FAOSTAT API Developer Portal (SDMX-based REST API)
 * Provides global agricultural statistics for benchmarking & comparison
 * API Docs: https://www.fao.org/faostat/en/api
 */

interface FAOSTATParams {
  area?: string;      // Country code (e.g., '114' for Kenya)
  item?: string;      // Commodity code
  element?: string;   // Data element (e.g., '5510' for production)
  year?: string;      // Year range (e.g., '2020,2024')
}

const FAOSTAT_BASE = 'https://api.fao.org/api/v1/en/data';
const KENYA_CODE = '114'; // FAOSTAT country code for Kenya

export class FAOSTATConnector {
  private apiKey: string;
  private cacheTTL: number = 3600; // 1 hour

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  /**
   * Get crop production data for Kenya
   */
  async getKenyaCropProduction(crop?: string, years?: string): Promise<any[]> {
    const params: FAOSTATParams = {
      area: KENYA_CODE,
      element: '5510', // Production quantity
      year: years || '2020,2024',
    };
    if (crop) params.item = crop;

    return this.query('QCL', params); // QCL = Crops and livestock products
  }

  /**
   * Get crop yield data for Kenya (kg/ha)
   */
  async getKenyaCropYield(crop?: string, years?: string): Promise<any[]> {
    const params: FAOSTATParams = {
      area: KENYA_CODE,
      element: '5412', // Yield
      year: years || '2020,2024',
    };
    if (crop) params.item = crop;

    return this.query('QCL', params);
  }

  /**
   * Get trade data (imports/exports) for Kenya
   */
  async getKenyaTradeData(commodity?: string, years?: string): Promise<any[]> {
    const params: FAOSTATParams = {
      area: KENYA_CODE,
      year: years || '2020,2024',
    };
    if (commodity) params.item = commodity;

    return this.query('TCL', params); // TCL = Trade in crops and livestock products
  }

  /**
   * Compare Kenya's yield against global average
   */
  async compareYieldToGlobal(crop: string): Promise<{
    kenya: number;
    global: number;
    gap: number;
    unit: string;
  }> {
    const kenyaData = await this.getKenyaCropYield(crop, '2022,2023');
    const globalData = await this.query('QCL', {
      element: '5412',
      item: crop,
      year: '2022,2023',
    });

    const kenyaYield = kenyaData[0]?.Value || 0;
    const globalYields = globalData.map((d: any) => d.Value).filter((v: number) => v > 0);
    const globalAvg = globalYields.reduce((a: number, b: number) => a + b, 0) / globalYields.length;

    return {
      kenya: kenyaYield,
      global: globalAvg,
      gap: ((globalAvg - kenyaYield) / globalAvg) * 100,
      unit: 'kg/ha',
    };
  }

  /**
   * Execute a FAOSTAT API query
   */
  private async query(dataset: string, params: FAOSTATParams): Promise<any[]> {
    const url = new URL(`${FAOSTAT_BASE}/${dataset}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    if (this.apiKey) {
      url.searchParams.append('apiKey', this.apiKey);
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`FAOSTAT API error: ${response.status}`);
      }
      const data = await response.json();
      return data.data || data || [];
    } catch (error) {
      console.error('[FAOSTAT] Query failed:', error);
      return [];
    }
  }
}

// Export singleton
export const faostat = new FAOSTATConnector(process.env.FAOSTAT_API_KEY);
