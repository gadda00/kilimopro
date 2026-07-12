import { useEffect, useState } from 'react';
import { Sun, Droplet, Wind, CloudRain, AlertTriangle } from 'lucide-react';
import { DataAggregator } from '@/lib/data/aggregator';
import { getCountryCoordinates, IGAD } from '@/lib/data/constants';
import type { WeatherData, WeatherAlert } from '@/lib/data/openmeteo';

export default function WeatherPage({ country }: { country: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const [lat, lon] = getCountryCoordinates(country);
    Promise.all([
      DataAggregator.getWeather(lat, lon, 7),
      DataAggregator.getWeatherAlerts(lat, lon),
    ]).then(([w, a]) => {
      setWeather(w);
      setAlerts(a);
      setLoading(false);
    });
  }, [country]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading weather...</div>;
  if (!weather) return <div className="p-8 text-center text-gray-500">No weather data available</div>;

  const today = weather.forecast[0];
  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Weather — {countryInfo?.flag} {countryInfo?.name}</h1>
      <p className="text-gray-500 mb-6 text-sm">Free data from Open-Meteo · Updated hourly</p>

      {/* Current */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <Sun className="w-6 h-6 text-amber-500 mb-2" />
          <div className="text-3xl font-bold">{Math.round(weather.current.temperature)}°C</div>
          <div className="text-sm text-gray-500">{weather.current.humidity}% humidity</div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <Droplet className="w-6 h-6 text-blue-500 mb-2" />
          <div className="text-3xl font-bold">{weather.current.rainfall}mm</div>
          <div className="text-sm text-gray-500">Rainfall today</div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <Wind className="w-6 h-6 text-gray-400 mb-2" />
          <div className="text-3xl font-bold">{Math.round(weather.current.windSpeed)}</div>
          <div className="text-sm text-gray-500">km/h wind</div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Weather Alerts ({alerts.length})
          </h2>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className={`p-3 rounded-lg border text-sm ${
                a.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
              }`}>
                <span className="font-medium capitalize">{a.type.replace('_', ' ')}</span>: {a.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-day forecast */}
      <h2 className="font-semibold text-gray-900 mb-3">7-Day Forecast</h2>
      <div className="grid grid-cols-7 gap-2">
        {weather.forecast.map((day, i) => (
          <div key={i} className="text-center p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</div>
            <div className="text-lg font-bold text-gray-900">{Math.round(day.temperatureMax)}°</div>
            <div className="text-xs text-gray-500">{Math.round(day.temperatureMin)}°</div>
            <div className="text-xs text-blue-600 mt-1">{day.rainfall}mm</div>
            <div className="text-xs text-gray-400">{day.rainfallProbability}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
