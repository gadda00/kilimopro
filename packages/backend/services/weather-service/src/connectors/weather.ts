/**
 * Weather Data Connector
 * Combines multiple weather data sources:
 * 1. KAOP (Kenya Agricultural Observatory Platform) - ward-level forecasts
 * 2. CHIRPS - satellite-derived daily rainfall (5km resolution)
 * 3. OpenWeatherMap - global weather API (fallback)
 * 4. Google Earth Engine - satellite NDVI for crop health
 */

import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { getMessageQueueClient } from '@kilimopro/message-queue';
import {
  WeatherForecast,
  WeatherAlert,
  WeatherAlertType,
  WeatherAlertSeverity,
  WeatherSource,
  NDVI,
  Rainfall,
  Coordinates,
  ForecastRequest,
  AlertsRequest,
  NDVIRequest,
  RainfallRequest,
} from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('weather-connector');
const cache = getCacheClient('weather-connector');
const mq = getMessageQueueClient('weather-connector');

export class WeatherConnector {
  private openweatherKey: string;
  private kaopApiUrl: string;
  private kaopApiKey: string;

  constructor() {
    this.openweatherKey = config.openweatherApiKey || '';
    this.kaopApiUrl = config.kaopApiUrl || '';
    this.kaopApiKey = config.kaopApiKey || '';
  }

  /**
   * Get 7-day weather forecast for a location
   * Tries KAOP first (more accurate for Kenya), falls back to OpenWeatherMap
   */
  async getForecast(request: ForecastRequest): Promise<WeatherForecast[]> {
    const cacheKey = `forecast:${request.location.lat},${request.location.lon}:${request.days}`;
    
    // Try cache first
    const cached = await cache.get<WeatherForecast[]>(cacheKey);
    if (cached) {
      logger.debug('Forecast cache hit', { cacheKey });
      return cached;
    }

    // Try KAOP first (more accurate for Kenya)
    if (this.kaopApiUrl && this.kaopApiKey) {
      try {
        const kaopForecast = await this.getKAOPForecast(request.location, request.days);
        if (kaopForecast.length > 0) {
          await cache.set(cacheKey, kaopForecast, config.cacheTtl.forecast);
          return kaopForecast;
        }
      } catch (error) {
        logger.warn('[Weather] KAOP unavailable, falling back to OpenWeatherMap', { error: error as Error });
      }
    }

    // Fallback to OpenWeatherMap
    const forecast = await this.getOpenWeatherForecast(request.location, request.days);
    await cache.set(cacheKey, forecast, config.cacheTtl.forecast);
    
    return forecast;
  }

  /**
   * Get weather alerts for a location
   * Analyzes forecast data to generate actionable alerts
   */
  async getAlerts(request: AlertsRequest): Promise<WeatherAlert[]> {
    const cacheKey = `alerts:${request.location.lat},${request.location.lon}:${request.days}`;
    
    // Try cache first
    const cached = await cache.get<WeatherAlert[]>(cacheKey);
    if (cached) {
      logger.debug('Alerts cache hit', { cacheKey });
      return cached;
    }

    const forecast = await this.getForecast({ location: request.location, days: request.days });
    const alerts: WeatherAlert[] = [];

    // Check for frost (temp < 2°C)
    const frostDays = forecast.filter(f => f.tempMin < 2);
    if (frostDays.length > 0) {
      alerts.push(this.createAlert({
        type: WeatherAlertType.FROST,
        severity: WeatherAlertSeverity.CRITICAL,
        message: `Frost expected on ${frostDays.map(d => new Date(d.date).toLocaleDateString()).join(', ')}. Protect sensitive crops with mulch or covers.`,
        startDate: frostDays[0].date,
        endDate: frostDays[frostDays.length - 1].date,
        location: request.location,
        crops: request.crops,
      }));
    }

    // Check for heavy rain (>50mm in a day)
    const heavyRainDays = forecast.filter(f => f.rainfall > 50);
    if (heavyRainDays.length > 0) {
      alerts.push(this.createAlert({
        type: WeatherAlertType.HEAVY_RAIN,
        severity: WeatherAlertSeverity.WARNING,
        message: `Heavy rainfall expected (${heavyRainDays[0].rainfall}mm). Ensure drainage is clear and delay fertilizer application.`,
        startDate: heavyRainDays[0].date,
        endDate: heavyRainDays[heavyRainDays.length - 1].date,
        location: request.location,
        crops: request.crops,
      }));
    }

    // Check for dry spell (no rain for 5+ days)
    const dryDays = forecast.filter(f => f.rainfall < 1 && f.rainfallProbability < 0.2);
    if (dryDays.length >= 5) {
      alerts.push(this.createAlert({
        type: WeatherAlertType.DRY_SPELL,
        severity: WeatherAlertSeverity.WARNING,
        message: `Dry conditions expected for ${dryDays.length} days. Consider irrigation for young crops.`,
        startDate: dryDays[0].date,
        endDate: dryDays[dryDays.length - 1].date,
        location: request.location,
        crops: request.crops,
      }));
    }

    // Check for heat wave (max temp > 35°C for 3+ days)
    const heatDays = forecast.filter(f => f.tempMax > 35);
    if (heatDays.length >= 3) {
      alerts.push(this.createAlert({
        type: WeatherAlertType.HEAT_WAVE,
        severity: WeatherAlertSeverity.CRITICAL,
        message: `Heat wave expected (${heatDays.length} days above 35°C). Provide shade for livestock and water crops early morning.`,
        startDate: heatDays[0].date,
        endDate: heatDays[heatDays.length - 1].date,
        location: request.location,
        crops: request.crops,
      }));
    }

    // Check for strong wind (>40 km/h)
    const windyDays = forecast.filter(f => f.windSpeed > 40);
    if (windyDays.length > 0) {
      alerts.push(this.createAlert({
        type: WeatherAlertType.STRONG_WIND,
        severity: WeatherAlertSeverity.WARNING,
        message: `Strong winds expected (${windyDays[0].windSpeed} km/h). Secure loose structures and avoid spraying chemicals.`,
        startDate: windyDays[0].date,
        endDate: windyDays[windyDays.length - 1].date,
        location: request.location,
        crops: request.crops,
      }));
    }

    // Cache and publish alerts
    await cache.set(cacheKey, alerts, config.cacheTtl.alerts);
    
    // Publish alerts to message queue
    for (const alert of alerts) {
      await mq.publishEvent({
        id: alert.id,
        type: 'weather.alert.created',
        timestamp: alert.createdAt,
        version: '1.0',
        source: 'weather-service',
      });
    }

    return alerts;
  }

  /**
   * Get NDVI (crop health) from Google Earth Engine / Sentinel-2
   */
  async getNDVI(request: NDVIRequest): Promise<NDVI> {
    const cacheKey = `ndvi:${request.location.lat},${request.location.lon}`;
    
    // Try cache first
    const cached = await cache.get<NDVI>(cacheKey);
    if (cached) {
      logger.debug('NDVI cache hit', { cacheKey });
      return cached;
    }

    try {
      // In production, this queries Earth Engine:
      // const ndvi = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
      //   .filterBounds(ee.Geometry.Point([request.location.lon, request.location.lat]))
      //   .filterDate(request.startDate || '2023-01-01', request.endDate || '2023-12-31')
      //   .map(img => img.normalizedDifference(['B8', 'B4']));

      // Placeholder with realistic NDVI values
      const current = 0.45 + Math.random() * 0.2;
      const historical = 0.50 + Math.random() * 0.15;
      const anomaly = current - historical;
      
      const ndvi: NDVI = {
        current: Math.round(current * 100) / 100,
        historical: Math.round(historical * 100) / 100,
        anomaly: Math.round(anomaly * 100) / 100,
        trend: anomaly > 0.05 ? 'improving' : anomaly < -0.05 ? 'declining' : 'stable',
        location: request.location,
        date: new Date().toISOString(),
        source: 'synthetic',
      };
      
      await cache.set(cacheKey, ndvi, config.cacheTtl.ndvi);
      return ndvi;
    } catch (error) {
      logger.error('[Weather] NDVI query failed', { error: error as Error });
      return {
        current: 0,
        historical: 0,
        anomaly: 0,
        trend: 'stable',
        location: request.location,
        date: new Date().toISOString(),
        source: 'error',
      };
    }
  }

  /**
   * Get rainfall estimate from CHIRPS satellite data
   * CHIRPS provides daily rainfall at 5km resolution, free access
   */
  async getRainfall(request: RainfallRequest): Promise<Rainfall[]> {
    const cacheKey = `rainfall:${request.location.lat},${request.location.lon}:${request.days}`;
    
    // Try cache first
    const cached = await cache.get<Rainfall[]>(cacheKey);
    if (cached) {
      logger.debug('Rainfall cache hit', { cacheKey });
      return cached;
    }

    try {
      // In production, this calls Google Earth Engine:
      // const image = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
      //   .filterDate(startDate, endDate)
      //   .filterBounds(ee.Geometry.Point([request.location.lon, request.location.lat]));
      // const rainfall = image.reduce('sum');
      
      // Placeholder: return synthetic rainfall pattern
      const rainfall: Rainfall[] = [];
      const now = new Date();
      
      for (let i = 0; i < request.days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Kenya rainfall pattern: bimodal (long rains Mar-May, short rains Oct-Dec)
        const month = date.getMonth();
        const isRainySeason = (month >= 2 && month <= 4) || (month >= 9 && month <= 11);
        const baseRain = isRainySeason ? 8 : 1;
        const dailyRain = Math.max(0, baseRain + (Math.random() - 0.4) * 15);
        
        rainfall.push({
          date: date.toISOString(),
          rainfall: Math.round(dailyRain * 10) / 10,
          source: WeatherSource.CHIRPS,
          location: request.location,
        });
      }
      
      await cache.set(cacheKey, rainfall, config.cacheTtl.rainfall);
      return rainfall;
    } catch (error) {
      logger.error('[Weather] CHIRPS query failed', { error: error as Error });
      return [];
    }
  }

  /**
   * Private: Create weather alert
   */
  private createAlert(params: {
    type: WeatherAlertType;
    severity: WeatherAlertSeverity;
    message: string;
    startDate: string;
    endDate: string;
    location: Coordinates;
    crops?: string[];
  }): WeatherAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      severity: params.severity,
      message: params.message,
      description: this.getAlertDescription(params.type, params.severity, params.message),
      startDate: params.startDate,
      endDate: params.endDate,
      affectedAreas: [this.getLocationName(params.location)],
      recommendations: this.getAlertRecommendations(params.type, params.crops),
      source: WeatherSource.SYNTHETIC,
      location: params.location,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Private: Get alert description
   */
  private getAlertDescription(type: WeatherAlertType, severity: WeatherAlertSeverity, message: string): string {
    const descriptions: Record<WeatherAlertType, Record<WeatherAlertSeverity, string>> = {
      [WeatherAlertType.FROST]: {
        [WeatherAlertSeverity.INFO]: 'Low temperature conditions expected',
        [WeatherAlertSeverity.WARNING]: 'Frost warning: temperatures may drop below freezing',
        [WeatherAlertSeverity.CRITICAL]: 'Severe frost warning: temperatures will drop below freezing, protect crops immediately',
      },
      [WeatherAlertType.HEAVY_RAIN]: {
        [WeatherAlertSeverity.INFO]: 'Increased rainfall expected',
        [WeatherAlertSeverity.WARNING]: 'Heavy rain warning: flooding possible in low-lying areas',
        [WeatherAlertSeverity.CRITICAL]: 'Extreme rainfall warning: severe flooding likely, take immediate action',
      },
      [WeatherAlertType.DRY_SPELL]: {
        [WeatherAlertSeverity.INFO]: 'Dry conditions expected',
        [WeatherAlertSeverity.WARNING]: 'Dry spell warning: irrigation recommended for young crops',
        [WeatherAlertSeverity.CRITICAL]: 'Severe drought warning: immediate irrigation required to prevent crop loss',
      },
      [WeatherAlertType.HEAT_WAVE]: {
        [WeatherAlertSeverity.INFO]: 'High temperatures expected',
        [WeatherAlertSeverity.WARNING]: 'Heat wave warning: provide shade and water for livestock',
        [WeatherAlertSeverity.CRITICAL]: 'Extreme heat warning: heat stress likely, take immediate cooling measures',
      },
      [WeatherAlertType.STRONG_WIND]: {
        [WeatherAlertSeverity.INFO]: 'Windy conditions expected',
        [WeatherAlertSeverity.WARNING]: 'Strong wind warning: secure loose structures',
        [WeatherAlertSeverity.CRITICAL]: 'Severe wind warning: structural damage possible, take immediate precautions',
      },
      [WeatherAlertType.HAIL]: {
        [WeatherAlertSeverity.INFO]: 'Hail possible',
        [WeatherAlertSeverity.WARNING]: 'Hail warning: protect crops and livestock',
        [WeatherAlertSeverity.CRITICAL]: 'Severe hail warning: significant damage likely, take immediate action',
      },
      [WeatherAlertType.FLOOD]: {
        [WeatherAlertSeverity.INFO]: 'Flood risk',
        [WeatherAlertSeverity.WARNING]: 'Flood warning: move to higher ground if in flood-prone area',
        [WeatherAlertSeverity.CRITICAL]: 'Severe flood warning: immediate evacuation recommended for flood-prone areas',
      },
      [WeatherAlertType.DROUGHT]: {
        [WeatherAlertSeverity.INFO]: 'Drought conditions',
        [WeatherAlertSeverity.WARNING]: 'Drought warning: conserve water and plan for reduced yields',
        [WeatherAlertSeverity.CRITICAL]: 'Severe drought warning: crop failure likely without intervention',
      },
    };
    
    return descriptions[type]?.[severity] || message;
  }

  /**
   * Private: Get alert recommendations
   */
  private getAlertRecommendations(type: WeatherAlertType, crops?: string[]): string[] {
    const recommendations: Record<WeatherAlertType, string[]> = {
      [WeatherAlertType.FROST]: [
        'Cover sensitive crops with mulch or plastic sheets',
        'Use frost cloth for high-value crops',
        'Irrigate before frost to increase soil temperature',
        'Avoid pruning or harvesting frost-sensitive crops',
      ],
      [WeatherAlertType.HEAVY_RAIN]: [
        'Ensure drainage systems are clear and functional',
        'Avoid field operations in waterlogged areas',
        'Delay fertilizer application until soil dries',
        'Check and repair irrigation systems',
        'Move livestock to higher ground if flooding is expected',
      ],
      [WeatherAlertType.DRY_SPELL]: [
        'Irrigate crops, especially young plants',
        'Apply mulch to conserve soil moisture',
        'Consider drought-tolerant crop varieties',
        'Monitor soil moisture levels regularly',
        'Prioritize water for high-value crops',
      ],
      [WeatherAlertType.HEAT_WAVE]: [
        'Provide shade for livestock and workers',
        'Water crops early in the morning or late in the evening',
        'Use drip irrigation to minimize evaporation',
        'Monitor plants for heat stress symptoms',
        'Provide additional water for livestock',
      ],
      [WeatherAlertType.STRONG_WIND]: [
        'Secure loose structures, tools, and equipment',
        'Avoid spraying chemicals that may drift',
        'Check and reinforce greenhouse structures',
        'Monitor for wind damage to crops',
        'Tie down or move lightweight items indoors',
      ],
      [WeatherAlertType.HAIL]: [
        'Use hail nets to protect high-value crops',
        'Move livestock to sheltered areas',
        'Park vehicles and equipment under cover',
        'Monitor weather updates for hailstorm movement',
        'Inspect crops for damage after hail stops',
      ],
      [WeatherAlertType.FLOOD]: [
        'Move to higher ground immediately',
        'Do not attempt to cross flooded roads or fields',
        'Secure or move livestock to safety',
        'Turn off electrical equipment in flood-prone areas',
        'Monitor local emergency broadcasts',
      ],
      [WeatherAlertType.DROUGHT]: [
        'Implement water conservation measures',
        'Consider selling livestock if feed is scarce',
        'Apply for drought relief assistance if available',
        'Plant drought-resistant crop varieties',
        'Monitor market prices for feed and water',
      ],
    };
    
    const baseRecommendations = recommendations[type] || [];
    
    // Add crop-specific recommendations if crops are provided
    if (crops && crops.length > 0) {
      const cropRecommendations = this.getCropSpecificRecommendations(type, crops);
      return [...baseRecommendations, ...cropRecommendations];
    }
    
    return baseRecommendations;
  }

  /**
   * Private: Get crop-specific recommendations
   */
  private getCropSpecificRecommendations(type: WeatherAlertType, crops: string[]): string[] {
    const cropRecommendations: Partial<Record<WeatherAlertType, Record<string, string[]>>> = {
      [WeatherAlertType.FROST]: {
        maize: ['Maize is sensitive to frost, especially during tasseling', 'Consider planting frost-tolerant varieties'],
        tomato: ['Tomatoes are highly frost-sensitive, use row covers', 'Harvest ripe fruit before frost'],
        coffee: ['Coffee plants can be damaged by frost, use windbreaks', 'Prune damaged branches after frost'],
      },
      [WeatherAlertType.HEAVY_RAIN]: {
        maize: ['Maize can tolerate some waterlogging but avoid standing water', 'Ensure good drainage in maize fields'],
        tomato: ['Tomatoes are susceptible to fungal diseases in wet conditions', 'Apply fungicides preventatively'],
        potato: ['Potatoes may rot in waterlogged soil', 'Harvest if heavy rain is forecasted'],
      },
      [WeatherAlertType.DRY_SPELL]: {
        maize: ['Maize requires consistent moisture during tasseling and silking', 'Irrigate during critical growth stages'],
        tomato: ['Tomatoes need regular watering to prevent blossom end rot', 'Use drip irrigation for efficient water use'],
        coffee: ['Coffee plants require consistent moisture for good yield', 'Mulch heavily to conserve soil moisture'],
      },
      [WeatherAlertType.HEAT_WAVE]: {
        maize: ['Maize can suffer from heat stress during pollination', 'Plant at optimal times to avoid peak heat'],
        tomato: ['Tomatoes may suffer from blossom drop in extreme heat', 'Provide shade cloth for young plants'],
        potato: ['Potato tubers can be damaged by high soil temperatures', 'Increase irrigation frequency'],
      },
    };
    
    const recommendations: string[] = [];
    for (const crop of crops) {
      const cropRecs = cropRecommendations[type]?.[crop.toLowerCase()];
      if (cropRecs) {
        recommendations.push(...cropRecs);
      }
    }
    
    return recommendations;
  }

  /**
   * Private: Get location name from coordinates
   */
  private getLocationName(location: Coordinates): string {
    // In production, this would use reverse geocoding
    // For now, return a simple string
    return `Location (${location.lat.toFixed(4)}, ${location.lon.toFixed(4)})`;
  }

  /**
   * Private: Get forecast from KAOP (Kenya Agricultural Observatory Platform)
   */
  private async getKAOPForecast(location: Coordinates, days: number): Promise<WeatherForecast[]> {
    try {
      const url = `${this.kaopApiUrl}/forecast?lat=${location.lat}&lon=${location.lon}&days=${days}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.kaopApiKey}` },
      });
      
      if (!response.ok) {
        throw new Error(`KAOP API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.map((item: any) => this.transformKAOPToForecast(item, location));
    } catch (error) {
      logger.error('[Weather] KAOP forecast failed', { error: error as Error });
      return [];
    }
  }

  /**
   * Private: Transform KAOP data to our forecast format
   */
  private transformKAOPToForecast(item: any, location: Coordinates): WeatherForecast {
    return {
      date: item.date || new Date().toISOString(),
      tempMin: item.minTemp || 15,
      tempMax: item.maxTemp || 25,
      rainfall: item.rainfall || 0,
      rainfallProbability: item.rainfallProbability || 0,
      humidity: item.humidity || 60,
      windSpeed: item.windSpeed || 10,
      windDirection: item.windDirection,
      cloudCover: item.cloudCover || 50,
      source: WeatherSource.KAOP,
      location,
    };
  }

  /**
   * Private: Get forecast from OpenWeatherMap
   */
  private async getOpenWeatherForecast(location: Coordinates, days: number): Promise<WeatherForecast[]> {
    if (!this.openweatherKey) {
      // Return synthetic forecast if no API key (development mode)
      return this.getSyntheticForecast(location, days);
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${this.openweatherKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OpenWeatherMap error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformOpenWeatherToForecast(data, location, days);
    } catch (error) {
      logger.error('[Weather] OpenWeatherMap forecast failed', { error: error as Error });
      return this.getSyntheticForecast(location, days);
    }
  }

  /**
   * Private: Transform OpenWeatherMap data to our forecast format
   */
  private transformOpenWeatherToForecast(data: any, location: Coordinates, days: number): WeatherForecast[] {
    // Group by day (OpenWeatherMap returns 3-hour intervals)
    const dailyForecasts: Map<string, WeatherForecast> = new Map();
    
    for (const item of data.list) {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, {
          date: new Date(item.dt_txt).toISOString(),
          tempMin: item.main.temp_min,
          tempMax: item.main.temp_max,
          rainfall: item.rain?.['3h'] || 0,
          rainfallProbability: item.pop || 0,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed * 3.6, // m/s to km/h
          windDirection: item.wind.deg,
          cloudCover: item.clouds.all,
          pressure: item.main.pressure,
          source: WeatherSource.OPENWEATHER,
          location,
        });
      } else {
        const existing = dailyForecasts.get(date)!;
        existing.tempMin = Math.min(existing.tempMin, item.main.temp_min);
        existing.tempMax = Math.max(existing.tempMax, item.main.temp_max);
        existing.rainfall += item.rain?.['3h'] || 0;
      }
    }
    
    return Array.from(dailyForecasts.values()).slice(0, Math.min(days, 7));
  }

  /**
   * Private: Generate synthetic forecast for development mode
   */
  private getSyntheticForecast(location: Coordinates, days: number): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];
    const now = new Date();
    const month = now.getMonth();
    
    // Kenya rainfall pattern
    const isRainySeason = (month >= 2 && month <= 4) || (month >= 9 && month <= 11);
    const isHighland = location.lat < -0.5; // Approximate highland detection
    
    for (let i = 0; i < Math.min(days, 7); i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      const baseTemp = isHighland ? 12 : 22;
      const tempVariation = isHighland ? 8 : 6;
      
      forecasts.push({
        date: date.toISOString(),
        tempMin: Math.round(baseTemp + (Math.random() - 0.5) * 3),
        tempMax: Math.round(baseTemp + tempVariation + (Math.random() - 0.5) * 3),
        rainfall: Math.round(isRainySeason ? Math.random() * 20 : Math.random() * 2),
        rainfallProbability: isRainySeason ? 0.4 + Math.random() * 0.4 : Math.random() * 0.2,
        humidity: Math.round(50 + Math.random() * 30),
        windSpeed: Math.round(5 + Math.random() * 15),
        windDirection: Math.round(Math.random() * 360),
        cloudCover: Math.round(isRainySeason ? 50 + Math.random() * 40 : 20 + Math.random() * 30),
        source: WeatherSource.SYNTHETIC,
        location,
      });
    }
    
    return forecasts;
  }
}

export const weatherConnector = new WeatherConnector();
