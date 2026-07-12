/**
 * KilimoPRO 2.0 — World Bank Indicators Integration
 *
 * Fetches agricultural and economic indicators from the World Bank's open
 * data API. Covers GDP, agricultural land %, fertilizer consumption, crop
 * production index, and more for all 8 IGAD countries.
 *
 * API: https://api.worldbank.org/v2
 * Free, no API key required.
 */

import { IGAD } from './constants';

const WORLD_BANK_API = 'https://api.worldbank.org/v2';

export interface WorldBankIndicator {
  indicatorCode: string;
  indicatorName: string;
  country: string;
  countryCode: string;
  year: number;
  value: number;
  unit: string;
}

// Key agricultural indicators
export const AG_INDICATORS = {
  AG_LND_AGRI_ZS:    { code: 'AG.LND.AGRI.ZS',    name: 'Agricultural land (% of land area)' },
  AG_LND_ARBL_ZS:    { code: 'AG.LND.ARBL.ZS',    name: 'Arable land (% of land area)' },
  AG_CON_FERT_ZS:    { code: 'AG.CON.FERT.ZS',    name: 'Fertilizer consumption (kg/ha arable)' },
  AG_YLD_CREL_KG:    { code: 'AG.YLD.CREL.KG',    name: 'Cereal yield (kg/ha)' },
  AG_PRD_LVSK_XD:    { code: 'AG.PRD.LVSK.XD',    name: 'Livestock production index' },
  AG_PRD_CROP_XD:    { code: 'AG.PRD.CROP.XD',    name: 'Crop production index' },
  NV_AGR_TOTL_ZS:    { code: 'NV.AGR.TOTL.ZS',    name: 'Agriculture, value added (% of GDP)' },
  SL_AGR_EMPL_ZS:    { code: 'SL.AGR.EMPL.ZS',    name: 'Employment in agriculture (% of total)' },
  ER_H2O_FWTL_ZS:    { code: 'ER.H2O.FWTL.ZS',    name: 'Freshwater withdrawal (% of internal)' },
  AG_LND_IRIG_ZS:    { code: 'AG.LND.IRIG.ZS',    name: 'Agricultural irrigated land (% of total)' },
} as const;

export async function fetchAgricultureIndicators(
  countryCode: string,
): Promise<WorldBankIndicator[]> {
  const country = IGAD.COUNTRIES[countryCode.toUpperCase() as keyof typeof IGAD.COUNTRIES];
  if (!country) return [];

  try {
    const indicatorCodes = Object.values(AG_INDICATORS).map(i => i.code).join(';');
    const params = new URLSearchParams({
      date: '2018:2024',  // last 5 years
      format: 'json',
      per_page: '100',
    });

    const response = await fetch(
      `${WORLD_BANK_API}/country/${country.iso3}/indicator/${indicatorCodes}?${params}`,
      { signal: AbortSignal.timeout(15000) },
    );

    if (!response.ok) return [];
    const data = await response.json();

    // World Bank returns [pagination, data] array
    if (!Array.isArray(data) || data.length < 2) return [];

    return (data[1] || []).map((item: any) => ({
      indicatorCode: item.indicator?.id || '',
      indicatorName: item.indicator?.value || '',
      country: item.country?.value || country.name,
      countryCode: countryCode.toUpperCase(),
      year: parseInt(item.date),
      value: parseFloat(item.value) || 0,
      unit: item.unit || '',
    })).filter((i: WorldBankIndicator) => i.value !== 0);
  } catch (error) {
    console.error('World Bank Indicators Error:', error);
    return [];
  }
}
