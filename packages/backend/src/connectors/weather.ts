/**
 * Weather Data Connector
 * Combines multiple weather data sources:
 * 1. KAOP (Kenya Agricultural Observatory Platform) — ward-level forecasts
 * 2. CHIRPS — satellite-derived daily rainfall (5km resolution)
 * 3. OpenWeatherMap — global weather API (fallback)
 * 4. Google Earth Engine — satellite NDVI for crop health
 */

interface WeatherForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  rainfall: number;       // mm
  rainfallProbability: number; // 0-1
  humidity: number;       // %
  windSpeed: number;      // km/h
  cloudCover: number;     // %
  source: string;
}

interface WeatherAlert {
  type: 'frost' | 'heavy_rain' | 'dry_spell' | 'heat_wave' | 'wind';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  startDate: string;
  endDate: string;
}

export class WeatherConnector {
  private openweatherKey: string;
  private kaopApiUrl: string;
  private kaopApiKey: string;

  constructor() {
    this.openweatherKey = process.env.OPENWEATHER_API_KEY || '';
    this.kaopApiUrl = process.env.KAOP_API_URL || '';
    this.kaopApiKey = process.env.KAOP_API_KEY || '';
  }

  /**
   * Get 7-day weather forecast for a location
   * Tries KAOP first (ward-level, Kenya-specific), falls back to OpenWeatherMap
   */
  async getForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
    // Try KAOP first (more accurate for Kenya)
    if (this.kaopApiUrl && this.kaopApiKey) {
      try {
        const kaopForecast = await this.getKAOPForecast(lat, lon);
        if (kaopForecast.length > 0) return kaopForecast;
      } catch (error) {
        console.warn('[Weather] KAOP unavailable, falling back to OpenWeatherMap');
      }
    }

    // Fallback to OpenWeatherMap
    return this.getOpenWeatherForecast(lat, lon);
  }

  /**
   * Get weather alerts for a location
   * Analyzes forecast data to generate actionable alerts
   */
  async getAlerts(lat: number, lon: number, crops?: string[]): Promise<WeatherAlert[]> {
    const forecast = await this.getForecast(lat, lon);
    const alerts: WeatherAlert[] = [];

    // Check for frost (temp < 2°C)
    const frostDays = forecast.filter(f => f.tempMin < 2);
    if (frostDays.length > 0) {
      alerts.push({
        type: 'frost',
        severity: 'critical',
        message: `Frost expected on ${frostDays.map(d => d.date).join(', ')}. Protect sensitive crops with mulch or covers.`,
        startDate: frostDays[0].date,
        endDate: frostDays[frostDays.length - 1].date,
      });
    }

    // Check for heavy rain (>50mm in a day)
    const heavyRainDays = forecast.filter(f => f.rainfall > 50);
    if (heavyRainDays.length > 0) {
      alerts.push({
        type: 'heavy_rain',
        severity: 'warning',
        message: `Heavy rainfall expected (${heavyRainDays[0].rainfall}mm). Ensure drainage is clear and delay fertilizer application.`,
        startDate: heavyRainDays[0].date,
        endDate: heavyRainDays[heavyRainDays.length - 1].date,
      });
    }

    // Check for dry spell (no rain for 7+ days)
    const dryDays = forecast.filter(f => f.rainfall < 1 && f.rainfallProbability < 0.2);
    if (dryDays.length >= 5) {
      alerts.push({
        type: 'dry_spell',
        severity: 'warning',
        message: `Dry conditions expected for ${dryDays.length} days. Consider irrigation for young crops.`,
        startDate: dryDays[0].date,
        endDate: dryDays[dryDays.length - 1].date,
      });
    }

    // Check for heat wave (max temp > 35°C for 3+ days)
    const heatDays = forecast.filter(f => f.tempMax > 35);
    if (heatDays.length >= 3) {
      alerts.push({
        type: 'heat_wave',
        severity: 'critical',
        message: `Heat wave expected (${heatDays.length} days above 35°C). Provide shade for livestock and water crops early morning.`,
        startDate: heatDays[0].date,
        endDate: heatDays[heatDays.length - 1].date,
      });
    }

    return alerts;
  }

  /**
   * Get rainfall estimate from CHIRPS satellite data
   * CHIRPS provides daily rainfall at 5km resolution, free access
   */
  async getCHIRPSRainfall(lat: number, lon: number, days: number = 30): Promise<number[]> {
    // CHIRPS data is accessed via Google Earth Engine or FTP
    // This would query the Earth Engine API for rainfall at the location
    try {
      // In production, this calls Google Earth Engine:
      // const image = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
      //   .filterDate(startDate, endDate)
      //   .filterBounds(ee.Geometry.Point([lon, lat]));
      // const rainfall = image.reduce('sum');
      
      // Placeholder: return synthetic rainfall pattern
      const rainfall: number[] = [];
      for (let i = 0; i < days; i++) {
        // Kenya rainfall pattern: bimodal (long rains Mar-May, short rains Oct-Dec)
        const month = new Date().getMonth();
        const isRainySeason = (month >= 2 && month <= 4) || (month >= 9 && month <= 11);
        const baseRain = isRainySeason ? 8 : 1;
        rainfall.push(Math.max(0, baseRain + (Math.random() - 0.4) * 15));
      }
      return rainfall;
    } catch (error) {
      console.error('[Weather] CHIRPS query failed:', error);
      return [];
    }
  }

  /**
   * Get NDVI (crop health) from Google Earth Engine / Sentinel-2
   */
  async getNDVI(lat: number, lon: number): Promise<{
    current: number;
    historical: number;
    anomaly: number;
    trend: 'improving' | 'declining' | 'stable';
  }> {
    try {
      // In production, this queries Earth Engine:
      // const ndvi = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
      //   .filterBounds(point)
      //   .filterDate(start, end)
      //   .map(img => img.normalizedDifference(['B8', 'B4']));

      // Placeholder with realistic NDVI values
      const current = 0.45 + Math.random() * 0.2;
      const historical = 0.50 + Math.random() * 0.15;
      const anomaly = current - historical;
      
      return {
        current: Math.round(current * 100) / 100,
        historical: Math.round(historical * 100) / 100,
        anomaly: Math.round(anomaly * 100) / 100,
        trend: anomaly > 0.05 ? 'improving' : anomaly < -0.05 ? 'declining' : 'stable',
      };
    } catch (error) {
      console.error('[Weather] NDVI query failed:', error);
      return { current: 0, historical: 0, anomaly: 0, trend: 'stable' };
    }
  }

  /**
   * Private: Get forecast from KAOP (Kenya Agricultural Observatory Platform)
   */
  private async getKAOPForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
    const response = await fetch(`${this.kaopApiUrl}/forecast?lat=${lat}&lon=${lon}`, {
      headers: { 'Authorization': `Bearer ${this.kaopApiKey}` },
    });
    if (!response.ok) throw new Error(`KAOP API error: ${response.status}`);
    return response.json();
  }

  /**
   * Private: Get forecast from OpenWeatherMap
   */
  private async getOpenWeatherForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
    if (!this.openweatherKey) {
      // Return synthetic forecast if no API key (development mode)
      return this.getSyntheticForecast(lat, lon);
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.openweatherKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OpenWeatherMap error: ${response.status}`);
    
    const data = await response.json();
    
    // Transform OpenWeatherMap response to our format
    // Group by day (OpenWeatherMap returns 3-hour intervals)
    const dailyForecasts: Map<string, WeatherForecast> = new Map();
    
    for (const item of data.list) {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, {
          date,
          tempMin: item.main.temp_min,
          tempMax: item.main.temp_max,
          rainfall: item.rain?.['3h'] || 0,
          rainfallProbability: item.pop || 0,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed * 3.6, // m/s to km/h
          cloudCover: item.clouds.all,
          source: 'openweather',
        });
      } else {
        const existing = dailyForecasts.get(date)!;
        existing.tempMin = Math.min(existing.tempMin, item.main.temp_min);
        existing.tempMax = Math.max(existing.tempMax, item.main.temp_max);
        existing.rainfall += item.rain?.['3h'] || 0;
      }
    }
    
    return Array.from(dailyForecasts.values()).slice(0, 7);
  }

  /**
   * Generate synthetic forecast for development mode
   */
  private getSyntheticForecast(lat: number, lon: number): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];
    const now = new Date();
    const month = now.getMonth();
    
    // Kenya rainfall pattern
    const isRainySeason = (month >= 2 && month <= 4) || (month >= 9 && month <= 11);
    const isHighland = lat < -0.5; // Approximate highland detection
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      const baseTemp = isHighland ? 12 : 22;
      const tempVariation = isHighland ? 8 : 6;
      
      forecasts.push({
        date: date.toISOString().split('T')[0],
        tempMin: Math.round(baseTemp + (Math.random() - 0.5) * 3),
        tempMax: Math.round(baseTemp + tempVariation + (Math.random() - 0.5) * 3),
        rainfall: Math.round(isRainySeason ? Math.random() * 20 : Math.random() * 2),
        rainfallProbability: isRainySeason ? 0.4 + Math.random() * 0.4 : Math.random() * 0.2,
        humidity: Math.round(50 + Math.random() * 30),
        windSpeed: Math.round(5 + Math.random() * 15),
        cloudCover: Math.round(isRainySeason ? 50 + Math.random() * 40 : 20 + Math.random() * 30),
        source: 'synthetic',
      });
    }
    
    return forecasts;
  }
}

export const weather = new WeatherConnector();
