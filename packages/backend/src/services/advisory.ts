/**
 * Advisory Service
 * Generates personalized crop management recommendations based on:
 * - Farmer location & agro-ecological zone
 * - Current weather & forecast
 * - Crop type & growth stage
 * - Soil health data
 * - Pest/disease alerts
 * - Market conditions
 */

import { weather } from '../connectors/weather.js';
import { market } from '../connectors/market.js';

interface FarmerContext {
  latitude: number;
  longitude: number;
  county: string;
  crops: string[];
  soilType?: string;
  irrigationType?: string;
  language?: string;
}

interface Recommendation {
  type: string;
  priority: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  actionUrl?: string;
}

// KALRO crop calendars — planting windows by agro-ecological zone
const CROP_CALENDARS: Record<string, {
  plantingWindows: { season: string; startMonth: number; endMonth: number }[];
  harvestWindow: { startMonth: number; endMonth: number };
  waterNeeds: 'low' | 'medium' | 'high';
  spacing: string;
  seedRate: string;
}> = {
  maize: {
    plantingWindows: [
      { season: 'Long rains', startMonth: 2, endMonth: 3 },  // Mar-Apr
      { season: 'Short rains', startMonth: 9, endMonth: 10 }, // Oct-Nov
    ],
    harvestWindow: { startMonth: 7, endMonth: 8 },
    waterNeeds: 'medium',
    spacing: '75cm x 30cm',
    seedRate: '25 kg/ha',
  },
  beans: {
    plantingWindows: [
      { season: 'Long rains', startMonth: 2, endMonth: 3 },
      { season: 'Short rains', startMonth: 9, endMonth: 10 },
    ],
    harvestWindow: { startMonth: 6, endMonth: 7 },
    waterNeeds: 'low',
    spacing: '50cm x 10cm',
    seedRate: '50 kg/ha',
  },
  'irish_potato': {
    plantingWindows: [
      { season: 'Main season', startMonth: 2, endMonth: 3 },
      { season: 'Off-season', startMonth: 8, endMonth: 9 },
    ],
    harvestWindow: { startMonth: 5, endMonth: 6 },
    waterNeeds: 'medium',
    spacing: '75cm x 30cm',
    seedRate: '2000 kg/ha',
  },
  tea: {
    plantingWindows: [{ season: 'Year-round', startMonth: 0, endMonth: 11 }],
    harvestWindow: { startMonth: 0, endMonth: 11 },
    waterNeeds: 'high',
    spacing: '1.2m x 0.6m',
    seedRate: '13,888 plants/ha',
  },
  rice: {
    plantingWindows: [{ season: 'Main season', startMonth: 0, endMonth: 1 }],
    harvestWindow: { startMonth: 4, endMonth: 5 },
    waterNeeds: 'high',
    spacing: '20cm x 20cm',
    seedRate: '40 kg/ha',
  },
};

// Common pests by crop and season
const PEST_DATABASE: Record<string, { name: string; season: string; symptoms: string; treatment: string }[]> = {
  maize: [
    { name: 'Fall Armyworm', season: 'All year', symptoms: 'Window-like holes on leaves, sawdust-like frass', treatment: 'Apply emamectin benzoate or spinosad at first sign. Scout fields weekly.' },
    { name: 'Stem Borer', season: 'Growing season', symptoms: 'Deadheart (dead central shoot), holes in stem', treatment: 'Plant push-pull strategy with Desmodium and Napier grass.' },
    { name: 'Maize Weevil', season: 'Storage', symptoms: 'Holes in stored grain, powdery residue', treatment: 'Dry grain to 13% moisture. Use Actellic dust or diatomaceous earth.' },
  ],
  beans: [
    { name: 'Bean Fly', season: 'Seedling stage', symptoms: 'Yellowing, wilting, swollen stems', treatment: 'Treat seed with imidacloprid. Plant early to avoid peak fly population.' },
    { name: 'Aphids', season: 'Flowering', symptoms: 'Curled leaves, sticky honeydew', treatment: 'Spray neem oil or use insecticidal soap. Encourage natural predators.' },
  ],
  'irish_potato': [
    { name: 'Late Blight', season: 'Rainy & cool', symptoms: 'Water-soaked lesions on leaves, white mold underneath', treatment: 'Apply Ridomil or copper-based fungicide. Remove infected plants.' },
    { name: 'Potato Cyst Nematode', season: 'All year', symptoms: 'Yellowing, stunted growth, cysts on roots', treatment: 'Rotate with non-host crops. Use resistant varieties.' },
  ],
};

export class AdvisoryService {
  /**
   * Generate comprehensive advisory for a farmer
   */
  async generateAdvisory(ctx: FarmerContext): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // 1. Weather-based recommendations
    const weatherAlerts = await weather.getAlerts(ctx.latitude, ctx.longitude, ctx.crops);
    for (const alert of weatherAlerts) {
      recommendations.push({
        type: 'weather_alert',
        priority: alert.severity as any,
        title: this.translateTitle(`Weather Alert: ${alert.type}`, ctx.language),
        body: alert.message,
      });
    }

    // 2. Crop calendar recommendations
    const currentMonth = new Date().getMonth();
    for (const crop of ctx.crops) {
      const calendar = CROP_CALENDARS[crop.toLowerCase().replace(' ', '_')];
      if (!calendar) continue;

      // Check if in planting window
      for (const window of calendar.plantingWindows) {
        if (currentMonth >= window.startMonth && currentMonth <= window.endMonth) {
          recommendations.push({
            type: 'planting_advice',
            priority: 'info',
            title: `${crop}: ${window.season} planting window is open`,
            body: `It's time to plant ${crop}. Recommended spacing: ${calendar.spacing}. Seed rate: ${calendar.seedRate}. Ensure soil is well-prepared and moisture is adequate.`,
          });
        }
      }

      // Check if approaching harvest
      if (currentMonth >= calendar.harvestWindow.startMonth - 1 && currentMonth <= calendar.harvestWindow.endMonth) {
        recommendations.push({
          type: 'harvest_timing',
          priority: 'info',
          title: `${crop}: Harvest season approaching`,
          body: `Prepare for ${crop} harvest. Monitor crop maturity indicators. Ensure drying and storage facilities are ready to minimize post-harvest losses.`,
        });
      }

      // Pest warnings
      const pests = PEST_DATABASE[crop.toLowerCase().replace(' ', '_')];
      if (pests) {
        for (const pest of pests) {
          if (pest.season === 'All year' || pest.season === 'Rainy & cool') {
            const isRainySeason = (currentMonth >= 2 && currentMonth <= 4) || (currentMonth >= 9 && currentMonth <= 11);
            if (pest.season === 'All year' || (pest.season === 'Rainy & cool' && isRainySeason)) {
              recommendations.push({
                type: 'pest_warning',
                priority: 'warning',
                title: `${crop}: Watch for ${pest.name}`,
                body: `Symptoms: ${pest.symptoms}. Treatment: ${pest.treatment}`,
              });
            }
          }
        }
      }
    }

    // 3. Market recommendations
    for (const crop of ctx.crops.slice(0, 3)) {
      try {
        const bestMarket = await market.findBestMarket(crop, ctx.county);
        if (bestMarket.priceDifference > 10) {
          recommendations.push({
            type: 'market_opportunity',
            priority: 'info',
            title: `${crop}: Better prices in ${bestMarket.bestMarket}`,
            body: bestMarket.recommendation,
          });
        }
      } catch {
        // Skip if market data unavailable
      }
    }

    // 4. Irrigation advice based on weather
    const forecast = await weather.getForecast(ctx.latitude, ctx.longitude);
    const dryDays = forecast.filter(f => f.rainfall < 1).length;
    if (dryDays >= 5 && ctx.irrigationType !== 'rainfed') {
      recommendations.push({
        type: 'irrigation_alert',
        priority: 'warning',
        title: 'Irrigation needed',
        body: `No significant rainfall expected for ${dryDays} days. Irrigate your crops, especially young plants and those in flowering or fruiting stages.`,
      });
    }

    // 5. NDVI crop health check
    try {
      const ndvi = await weather.getNDVI(ctx.latitude, ctx.longitude);
      if (ndvi.trend === 'declining' && ndvi.anomaly < -0.1) {
        recommendations.push({
          type: 'crop_health',
          priority: 'warning',
          title: 'Crop health declining',
          body: `Satellite imagery shows your crop health (NDVI: ${ndvi.current}) is below the historical average (${ndvi.historical}). Possible causes: water stress, nutrient deficiency, or pest/disease pressure. Inspect your fields.`,
        });
      }
    } catch {
      // Skip if satellite data unavailable
    }

    return recommendations;
  }

  /**
   * Generate a daily farm report
   */
  async generateDailyReport(ctx: FarmerContext): Promise<{
    date: string;
    weather: { summary: string; temp: string; rain: string };
    tasks: string[];
    alerts: string[];
    market: string[];
  }> {
    const forecast = await weather.getForecast(ctx.latitude, ctx.longitude);
    const today = forecast[0] || { tempMin: 0, tempMax: 0, rainfall: 0, rainfallProbability: 0 };
    const recommendations = await this.generateAdvisory(ctx);

    const tasks: string[] = [];
    const alerts: string[] = [];
    const marketNotices: string[] = [];

    for (const rec of recommendations) {
      if (rec.priority === 'critical') alerts.push(rec.body);
      else if (rec.type === 'market_opportunity') marketNotices.push(rec.body);
      else tasks.push(rec.body);
    }

    return {
      date: new Date().toISOString().split('T')[0],
      weather: {
        summary: today.rainfall > 5 ? 'Rainy' : today.tempMax > 30 ? 'Hot' : 'Fair',
        temp: `${today.tempMin}°C - ${today.tempMax}°C`,
        rain: `${today.rainfall}mm (${(today.rainfallProbability * 100).toFixed(0)}% chance)`,
      },
      tasks,
      alerts,
      market: marketNotices,
    };
  }

  private translateTitle(title: string, language?: string): string {
    if (language === 'sw') {
      const translations: Record<string, string> = {
        'Weather Alert: frost': 'Onyo la Hudhi: Barafu',
        'Weather Alert: heavy_rain': 'Onyo la Hudhi: Mvua kubwa',
        'Weather Alert: dry_spell': 'Onyo la Hudhi: Ukame',
        'Weather Alert: heat_wave': 'Onyo la Hudhi: Joto kali',
      };
      return translations[title] || title;
    }
    return title;
  }
}

export const advisory = new AdvisoryService();
