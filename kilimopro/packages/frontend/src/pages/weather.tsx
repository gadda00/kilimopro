import { useEffect, useState } from 'react';
import { Sun, Droplet, Wind, AlertTriangle, Thermometer } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DataAggregator } from '@/lib/data/aggregator';
import { getCountryCoordinates, IGAD } from '@/lib/data/constants';
import type { WeatherData, WeatherAlert } from '@/lib/data/openmeteo';

export default function WeatherPage({ country }: { country: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const [lat, lon] = getCountryCoordinates(country);
    Promise.all([
      DataAggregator.getWeather(lat, lon, 7),
      DataAggregator.getWeatherAlerts(lat, lon),
    ]).then(([w, a]) => {
      setWeather(w);
      setAlerts(a);
      setLoading(false);
    }).catch(() => {
      setError('Could not load weather data. Please try again.');
      setLoading(false);
    });
  }, [country]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-4 border-kilimo-100 border-t-kilimo-600 rounded-full"
      />
    </div>
  );
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500 mb-3">⚠️ {error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-kilimo-600 text-white text-sm">Retry</button>
    </div>
  );
  if (!weather || !weather.forecast || weather.forecast.length === 0) return (
    <div className="p-8 text-center text-gray-500">
      <p>No weather data available for this location.</p>
      <p className="text-xs mt-1">Try selecting a different country.</p>
    </div>
  );

  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];
  const today = weather.forecast[0];

  const chartData = weather.forecast.map(f => ({
    day: new Date(f.date).toLocaleDateString('en', { weekday: 'short' }),
    temp: Math.round((f.temperatureMin + f.temperatureMax) / 2),
    max: Math.round(f.temperatureMax),
    min: Math.round(f.temperatureMin),
    rain: f.rainfall,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-gray-900 mb-1"
      >
        Weather — {countryInfo?.flag} {countryInfo?.name}
      </motion.h1>
      <p className="text-gray-500 mb-6 text-sm">Free data from Open-Meteo · Updated hourly</p>

      {/* Current conditions */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: Sun, label: 'Temperature', value: `${Math.round(weather.current.temperature)}°C`, color: 'text-amber-500' },
          { icon: Droplet, label: 'Rainfall', value: `${weather.current.rainfall}mm`, color: 'text-blue-500' },
          { icon: Wind, label: 'Wind Speed', value: `${Math.round(weather.current.windSpeed)} km/h`, color: 'text-gray-400' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl border p-5 shadow-sm"
            >
              <Icon className={`w-6 h-6 ${card.color} mb-2`} />
              <div className="text-3xl font-bold">{card.value}</div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Weather Alerts ({alerts.length})
          </h2>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-3 rounded-lg border text-sm ${
                  a.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                }`}
              >
                <span className="font-medium capitalize">{a.type.replace('_', ' ')}</span>: {a.message}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Temperature chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border p-5 shadow-sm mb-6"
      >
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-red-500" /> Temperature Trend (7 days)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={2} name="High (°C)" />
            <Line type="monotone" dataKey="min" stroke="#3b82f6" strokeWidth={2} name="Low (°C)" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Rainfall chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border p-5 shadow-sm mb-6"
      >
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Droplet className="w-5 h-5 text-blue-500" /> Rainfall Forecast (7 days)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="rain" fill="#3b82f6" name="Rainfall (mm)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* 7-day strip — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:grid sm:grid-cols-7 sm:overflow-visible">
        {weather.forecast.map((day, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            className="text-center p-3 rounded-lg bg-gray-50"
          >
            <div className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</div>
            <div className="text-lg font-bold text-gray-900">{Math.round(day.temperatureMax)}°</div>
            <div className="text-xs text-gray-500">{Math.round(day.temperatureMin)}°</div>
            <div className="text-xs text-blue-600 mt-1">{day.rainfall}mm</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
