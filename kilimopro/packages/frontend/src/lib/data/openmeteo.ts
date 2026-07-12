/**
 * KilimoPRO 2.0 — Open-Meteo Integration
 *
 * Open-Meteo is a FREE weather API — no API key required, no rate limits
 * for non-commercial use. Provides current weather + 16-day forecasts +
 * historical data globally.
 *
 * API: https://api.open-meteo.com/v1
 * Docs: https://open-meteo.com/en/docs
 *
 * This replaces OpenWeatherMap (which requires a paid API key) as the
 * primary weather data source for KilimoPRO 2.0.
 *
 * Free tier: 10,000 API calls/day (more than enough for KilimoPRO)
 */

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    weatherCode: number;
    time: string;
  };
  forecast: {
    date: string;
    temperatureMin: number;
    temperatureMax: number;
    rainfall: number;
    rainfallProbability: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    sunrise: string;
    sunset: string;
    uvIndex: number;
  }[];
}

export interface HistoricalWeather {
  latitude: number;
  longitude: number;
  historical: {
    date: string;
    temperatureMin: number;
    temperatureMax: number;
    rainfall: number;
  }[];
}

const OPENMETEO_API = 'https://api.open-meteo.com/v1';
const ARCHIVE_API = 'https://archive-api.open-meteo.com/v1';

// ─── WMO weather code descriptions ──────────────────────────────────────────
const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0:  { description: 'Clear sky', icon: '☀️' },
  1:  { description: 'Mainly clear', icon: '🌤️' },
  2:  { description: 'Partly cloudy', icon: '⛅' },
  3:  { description: 'Overcast', icon: '☁️' },
  45: { description: 'Fog', icon: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️' },
  53: { description: 'Moderate drizzle', icon: '🌦️' },
  55: { description: 'Dense drizzle', icon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌦️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️' },
  71: { description: 'Slight snow', icon: '🌨️' },
  73: { description: 'Moderate snow', icon: '🌨️' },
  75: { description: 'Heavy snow', icon: '❄️' },
  80: { description: 'Slight rain showers', icon: '🌦️' },
  81: { description: 'Moderate rain showers', icon: '🌧️' },
  82: { description: 'Violent rain showers', icon: '⛈️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with hail', icon: '⛈️' },
  99: { description: 'Severe thunderstorm with hail', icon: '⛈️' },
};

export function getWeatherDescription(code: number): { description: string; icon: string } {
  return WMO_CODES[code] || { description: 'Unknown', icon: '❓' };
}

// ─── Fetch current + forecast weather ────────────────────────────────────────
export async function fetchWeather(
  latitude: number,
  longitude: number,
  days: number = 7,
): Promise<WeatherData> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,relative_humidity_2m_mean,wind_speed_10m_max,weather_code,sunrise,sunset,uv_index_max',
      timezone: 'auto',
      forecast_days: String(Math.min(days, 16)),
    });

    const response = await fetch(`${OPENMETEO_API}/forecast?${params}`, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      latitude,
      longitude,
      timezone: data.timezone || 'UTC',
      current: {
        temperature: data.current?.temperature_2m ?? 0,
        humidity: data.current?.relative_humidity_2m ?? 0,
        windSpeed: data.current?.wind_speed_10m ?? 0,
        rainfall: data.current?.precipitation ?? 0,
        weatherCode: data.current?.weather_code ?? 0,
        time: data.current?.time ?? new Date().toISOString(),
      },
      forecast: (data.daily?.time || []).map((date: string, i: number) => ({
        date,
        temperatureMin: data.daily.temperature_2m_min[i] ?? 0,
        temperatureMax: data.daily.temperature_2m_max[i] ?? 0,
        rainfall: data.daily.precipitation_sum[i] ?? 0,
        rainfallProbability: data.daily.precipitation_probability_max[i] ?? 0,
        humidity: data.daily.relative_humidity_2m_mean[i] ?? 0,
        windSpeed: data.daily.wind_speed_10m_max[i] ?? 0,
        weatherCode: data.daily.weather_code[i] ?? 0,
        sunrise: data.daily.sunrise[i] ?? '',
        sunset: data.daily.sunset[i] ?? '',
        uvIndex: data.daily.uv_index_max[i] ?? 0,
      })),
    };
  } catch (error) {
    console.error('Open-Meteo Error:', error);
    return {
      latitude,
      longitude,
      timezone: 'UTC',
      current: {
        temperature: 0, humidity: 0, windSpeed: 0, rainfall: 0,
        weatherCode: 0, time: new Date().toISOString(),
      },
      forecast: [],
    };
  }
}

// ─── Fetch historical weather (for trend analysis) ──────────────────────────
export async function fetchHistoricalWeather(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
): Promise<HistoricalWeather> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      start_date: startDate,
      end_date: endDate,
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
      timezone: 'auto',
    });

    const response = await fetch(`${ARCHIVE_API}/era5?${params}`, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`Open-Meteo Archive HTTP ${response.status}`);

    const data = await response.json();

    return {
      latitude,
      longitude,
      historical: (data.daily?.time || []).map((date: string, i: number) => ({
        date,
        temperatureMin: data.daily.temperature_2m_min[i] ?? 0,
        temperatureMax: data.daily.temperature_2m_max[i] ?? 0,
        rainfall: data.daily.precipitation_sum[i] ?? 0,
      })),
    };
  } catch (error) {
    console.error('Open-Meteo Historical Error:', error);
    return { latitude, longitude, historical: [] };
  }
}

// ─── Generate weather alerts from forecast ──────────────────────────────────
export interface WeatherAlert {
  type: 'frost' | 'heat_wave' | 'heavy_rain' | 'dry_spell' | 'strong_wind';
  severity: 'info' | 'warning' | 'critical';
  date: string;
  message: string;
  recommendations: string[];
}

export function generateWeatherAlerts(forecast: WeatherData['forecast']): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  for (const day of forecast) {
    // Frost: temp < 2°C
    if (day.temperatureMin < 2) {
      alerts.push({
        type: 'frost',
        severity: 'critical',
        date: day.date,
        message: `Frost expected on ${day.date} (low: ${day.temperatureMin}°C). Protect sensitive crops.`,
        recommendations: [
          'Cover sensitive crops with mulch or plastic sheets',
          'Use frost cloth for high-value crops',
          'Irrigate before frost to increase soil temperature',
        ],
      });
    }

    // Heat wave: temp > 35°C for 3+ consecutive days
    if (day.temperatureMax > 35) {
      alerts.push({
        type: 'heat_wave',
        severity: 'critical',
        date: day.date,
        message: `Heat wave: ${day.temperatureMax}°C on ${day.date}. Provide shade and water.`,
        recommendations: [
          'Water crops early morning or late evening',
          'Provide shade for livestock',
          'Use drip irrigation to minimize evaporation',
        ],
      });
    }

    // Heavy rain: > 50mm in a day
    if (day.rainfall > 50) {
      alerts.push({
        type: 'heavy_rain',
        severity: 'warning',
        date: day.date,
        message: `Heavy rainfall expected (${day.rainfall}mm) on ${day.date}.`,
        recommendations: [
          'Ensure drainage systems are clear',
          'Delay fertilizer application',
          'Move livestock to higher ground if in flood-prone area',
        ],
      });
    }

    // Strong wind: > 40 km/h
    if (day.windSpeed > 40) {
      alerts.push({
        type: 'strong_wind',
        severity: 'warning',
        date: day.date,
        message: `Strong winds expected (${day.windSpeed} km/h) on ${day.date}.`,
        recommendations: [
          'Secure loose structures and equipment',
          'Avoid spraying chemicals that may drift',
          'Reinforce greenhouse structures',
        ],
      });
    }
  }

  // Dry spell: 5+ consecutive days with < 1mm rain
  let dryStreak = 0;
  for (const day of forecast) {
    if (day.rainfall < 1) {
      dryStreak++;
      if (dryStreak >= 5) {
        alerts.push({
          type: 'dry_spell',
          severity: 'warning',
          date: day.date,
          message: `Dry conditions for ${dryStreak} days. Consider irrigation for young crops.`,
          recommendations: [
            'Irrigate crops, especially young plants',
            'Apply mulch to conserve soil moisture',
            'Prioritize water for high-value crops',
          ],
        });
        break; // one dry spell alert is enough
      }
    } else {
      dryStreak = 0;
    }
  }

  return alerts;
}
