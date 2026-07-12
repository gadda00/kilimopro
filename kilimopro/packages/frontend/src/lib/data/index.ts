/**
 * KilimoPRO 2.0 — Data Layer Index
 *
 * Single entry point for all data access in KilimoPRO 2.0.
 * Import from here: `import { DataAggregator, IGAD } from '@/lib/data'`
 */

export { IGAD, getCountry, getCountryCoordinates, getCountryCurrency, getCrop, getCurrentSeason, getAllCountryCodes, getAllCropCodes } from './constants';
export { DataAggregator } from './aggregator';
export { fetchFAOMarketPrices, fetchFAOProduction, fetchFAOPriceHistory, FAOSTAT_DOMAINS, FAOSTAT_ELEMENTS } from './faostat';
export type { MarketPriceData, ProductionData, PriceHistoryPoint } from './faostat';
export { fetchICPACAlerts, fetchICPACAgricultureWatch, fetchICPACClimateForecast } from './icpac';
export type { ICPACAlert, ICPACAgricultureWatch, ICPACClimateForecast } from './icpac';
export { fetchWeather, fetchHistoricalWeather, generateWeatherAlerts, getWeatherDescription } from './openmeteo';
export type { WeatherData, WeatherAlert, HistoricalWeather } from './openmeteo';
export { fetchAgricultureIndicators, AG_INDICATORS } from './worldbank';
export type { WorldBankIndicator } from './worldbank';
