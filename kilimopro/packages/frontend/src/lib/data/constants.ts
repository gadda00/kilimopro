/**
 * KilimoPRO 2.0 — IGAD Constants
 *
 * IGAD = Intergovernmental Authority on Development
 * Covers 8 East African countries: Djibouti, Eritrea, Ethiopia, Kenya,
 * Somalia, South Sudan, Sudan, Uganda.
 *
 * This is the foundation for KilimoPRO 2.0's multi-country expansion.
 * All data connectors (FAOSTAT, ICPAC, Open-Meteo, World Bank) use these
 * constants to map between country codes, FAO codes, ISO3 codes, and
 * geographic coordinates.
 *
 * Source: https://www.igad.int
 */

export const IGAD = {
  COUNTRIES: {
    DJ: { name: 'Djibouti', code: 'DJ', faoCode: '834', iso3: 'DJI', flag: '🇩🇯' },
    ER: { name: 'Eritrea', code: 'ER', faoCode: '232', iso3: 'ERI', flag: '🇪🇷' },
    ET: { name: 'Ethiopia', code: 'ET', faoCode: '231', iso3: 'ETH', flag: '🇪🇹' },
    KE: { name: 'Kenya', code: 'KE', faoCode: '404', iso3: 'KEN', flag: '🇰🇪' },
    SO: { name: 'Somalia', code: 'SO', faoCode: '706', iso3: 'SOM', flag: '🇸🇴' },
    SS: { name: 'South Sudan', code: 'SS', faoCode: '728', iso3: 'SSD', flag: '🇸🇸' },
    SD: { name: 'Sudan', code: 'SD', faoCode: '729', iso3: 'SDN', flag: '🇸🇩' },
    UG: { name: 'Uganda', code: 'UG', faoCode: '800', iso3: 'UGA', flag: '🇺🇬' },
  },

  // Capital city coordinates (for default weather lookups)
  COORDS: {
    DJ: [11.8251, 42.5903],
    ER: [15.3229, 38.9251],
    ET: [9.0389, 38.7628],
    KE: [-1.2921, 36.8219],
    SO: [2.0411, 45.3437],
    SS: [4.8593, 31.5717],
    SD: [15.8905, 30.9731],
    UG: [0.3476, 32.5825],
  },

  // Major crops relevant to the IGAD region
  CROPS: {
    maize:    { code: '56',    name: 'Maize',         faoCode: '56',    category: 'cereal' },
    wheat:    { code: '67',    name: 'Wheat',         faoCode: '67',    category: 'cereal' },
    sorghum:  { code: '57',    name: 'Sorghum',       faoCode: '57',    category: 'cereal' },
    millet:   { code: '62',    name: 'Millet',        faoCode: '62',    category: 'cereal' },
    rice:     { code: '66',    name: 'Rice, paddy',   faoCode: '66',    category: 'cereal' },
    beans:    { code: '176',   name: 'Beans, dry',    faoCode: '176',   category: 'pulse' },
    cassava:  { code: '125',   name: 'Cassava',       faoCode: '125',   category: 'root' },
    potato:   { code: '116',   name: 'Potato',        faoCode: '116',   category: 'root' },
    coffee:   { code: '1058',  name: 'Coffee, green', faoCode: '1058',  category: 'cash crop' },
    tea:      { code: '1061',  name: 'Tea',           faoCode: '1061',  category: 'cash crop' },
    cotton:   { code: '1066',  name: 'Cotton lint',   faoCode: '1066',  category: 'cash crop' },
    sugarcane:{ code: '156',   name: 'Sugar cane',    faoCode: '156',   category: 'cash crop' },
    banana:   { code: '486',   name: 'Bananas',       faoCode: '486',   category: 'fruit' },
    tomato:   { code: '388',   name: 'Tomatoes',      faoCode: '388',   category: 'vegetable' },
    onion:    { code: '406',   name: 'Onions, dry',   faoCode: '406',   category: 'vegetable' },
  },

  // Currencies (ISO 4217)
  CURRENCIES: {
    DJ: 'DJF', ER: 'ERN', ET: 'ETB', KE: 'KES',
    SO: 'SOS', SS: 'SSP', SD: 'SDG', UG: 'UGX',
  },

  // Languages spoken in each country
  LANGUAGES: {
    DJ: ['fr', 'ar', 'so'],      // French, Arabic, Somali
    ER: ['ti', 'ar', 'en'],      // Tigrinya, Arabic, English
    ET: ['am', 'om', 'en'],      // Amharic, Oromo, English
    KE: ['sw', 'en'],            // Swahili, English
    SO: ['so', 'ar', 'en'],      // Somali, Arabic, English
    SS: ['en', 'ar'],            // English, Arabic
    SD: ['ar', 'en'],            // Arabic, English
    UG: ['en', 'sw', 'lg'],      // English, Swahili, Luganda
  },

  // IGAD regions for climate forecasting
  REGIONS: {
    eastern:  { name: 'Eastern IGAD',  countries: ['KE', 'SO', 'ET'] },
    western:  { name: 'Western IGAD',  countries: ['UG', 'KE'] },
    northern: { name: 'Northern IGAD', countries: ['SD', 'SS', 'ER'] },
    southern: { name: 'Southern IGAD', countries: ['DJ', 'SO', 'ET'] },
  },

  // Seasons for agricultural planning
  SEASONS: {
    long_rains:   { name: 'Long Rains',    months: [3, 4, 5],        description: 'Main planting season (Mar-May)' },
    short_rains:  { name: 'Short Rains',   months: [10, 11, 12],     description: 'Secondary planting season (Oct-Dec)' },
    dry_jan_feb:  { name: 'Dry (Jan-Feb)', months: [1, 2],           description: 'Hot dry season' },
    dry_jun_sep:  { name: 'Dry (Jun-Sep)', months: [6, 7, 8, 9],     description: 'Cool dry season' },
  },
} as const;

// Helper functions
export function getCountry(code: string) {
  return IGAD.COUNTRIES[code.toUpperCase() as keyof typeof IGAD.COUNTRIES];
}

export function getCountryCoordinates(code: string): [number, number] {
  const coords = IGAD.COORDS[code.toUpperCase() as keyof typeof IGAD.COORDS] || IGAD.COORDS.KE;
  return [coords[0], coords[1]];
}

export function getCountryCurrency(code: string): string {
  return IGAD.CURRENCIES[code.toUpperCase() as keyof typeof IGAD.CURRENCIES] || 'USD';
}

export function getCrop(cropName: string) {
  return IGAD.CROPS[cropName.toLowerCase() as keyof typeof IGAD.CROPS];
}

export function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1; // 1-12
  for (const [key, season] of Object.entries(IGAD.SEASONS)) {
    if ((season as any).months.includes(month)) {
      return key;
    }
  }
  return 'dry_jan_feb';
}

export function getAllCountryCodes(): string[] {
  return Object.keys(IGAD.COUNTRIES);
}

export function getAllCropCodes(): string[] {
  return Object.values(IGAD.CROPS).map(c => c.faoCode);
}
