import { useEffect, useState } from 'react';
import Head from 'next/head';
import { CloudRain, TrendingUp, AlertTriangle, MapPin, Sun, Droplet, Wind, Activity, Globe } from 'lucide-react';
import { CountrySelector } from '@/components/shared/country-selector';
import { DataAggregator } from '@/lib/data/aggregator';
import { IGAD, getCountryCoordinates, getCountryCurrency } from '@/lib/data/constants';
import type { ICPACAlert } from '@/lib/data/icpac';
import type { WeatherData } from '@/lib/data/openmeteo';

export default function ClimateDashboard() {
  const [country, setCountry] = useState('KE');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<ICPACAlert[]>([]);
  const [watch, setWatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [lat, lon] = getCountryCoordinates(country);
      try {
        const [w, a, aw] = await Promise.all([
          DataAggregator.getWeather(lat, lon, 7),
          DataAggregator.getHazardAlerts(country),
          DataAggregator.getAgricultureWatch(),
        ]);
        setWeather(w);
        setAlerts(a);
        setWatch(aw);
      } catch (e) {
        console.error('Failed to load climate data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [country]);

  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];

  return (
    <>
      <Head>
        <title>Climate Dashboard — KilimoPRO 2.0</title>
        <meta name="description" content="Real-time climate data for 8 IGAD countries in East Africa" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-kilimo-50 to-white">
        {/* Header */}
        <header className="bg-kilimo-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <CloudRain className="w-7 h-7" />
                  KilimoPRO 2.0 — Climate Dashboard
                </h1>
                <p className="text-green-100 text-sm mt-1">
                  Real-time agricultural intelligence for 8 IGAD countries
                </p>
              </div>
              <CountrySelector value={country} onChange={setCountry} />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Country Info Banner */}
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <span className="text-4xl">{countryInfo?.flag}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{countryInfo?.name}</h2>
              <p className="text-sm text-gray-500">
                Currency: {getCountryCurrency(country)} · FAO Code: {countryInfo?.faoCode}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 rounded-full border-4 border-kilimo-100 border-t-kilimo-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Weather Card */}
              {weather && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Sun className="w-5 h-5 text-amber-500" />
                      <h3 className="font-semibold text-gray-900">Current Weather</h3>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {Math.round(weather.current.temperature)}°C
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {weather.current.humidity}% humidity · {weather.current.windSpeed} km/h wind
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Droplet className="w-5 h-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-900">Rainfall Today</h3>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {weather.current.rainfall}mm
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {weather.forecast[0]?.rainfallProbability || 0}% probability
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Wind className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-900">7-Day Range</h3>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {Math.round(Math.min(...weather.forecast.map(f => f.temperatureMin)))}–
                      {Math.round(Math.max(...weather.forecast.map(f => f.temperatureMax)))}°C
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Total rain: {weather.forecast.reduce((s, f) => s + f.rainfall, 0).toFixed(1)}mm
                    </div>
                  </div>
                </div>
              )}

              {/* 7-Day Forecast */}
              {weather && weather.forecast.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">7-Day Forecast</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {weather.forecast.map((day, i) => (
                      <div key={i} className="text-center p-2 rounded-lg bg-gray-50">
                        <div className="text-xs text-gray-500 mb-1">
                          {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                        </div>
                        <div className="text-sm font-bold text-gray-900">{Math.round(day.temperatureMax)}°</div>
                        <div className="text-xs text-gray-500">{Math.round(day.temperatureMin)}°</div>
                        <div className="text-xs text-blue-600">{day.rainfall}mm</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Climate Alerts */}
              {alerts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">Active Climate Alerts ({alerts.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {alerts.map((alert, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-lg border ${
                          alert.severity === 'extreme' ? 'bg-red-50 border-red-200' :
                          alert.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                          alert.severity === 'moderate' ? 'bg-amber-50 border-amber-200' :
                          'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-gray-900">{alert.title}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            alert.severity === 'extreme' ? 'bg-red-200 text-red-800' :
                            alert.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                            alert.severity === 'moderate' ? 'bg-amber-200 text-amber-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        {alert.advisory && (
                          <p className="text-sm text-gray-700 bg-white/50 rounded p-2">
                            💡 {alert.advisory}
                          </p>
                        )}
                        {alert.mitigationMeasures && alert.mitigationMeasures.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-medium text-gray-500 mb-1">Mitigation:</div>
                            <ul className="text-xs text-gray-600 list-disc list-inside space-y-0.5">
                              {alert.mitigationMeasures.slice(0, 3).map((m, j) => (
                                <li key={j}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agriculture Watch */}
              {watch && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-kilimo-600" />
                    <h3 className="font-semibold text-gray-900">Agriculture Watch (ICPAC)</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{watch.summary}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(watch.crops || {}).slice(0, 8).map(([crop, data]: [string, any]) => (
                      <div key={crop} className="p-3 rounded-lg bg-gray-50">
                        <div className="text-sm font-medium text-gray-900 capitalize">{crop}</div>
                        <div className="text-xs text-gray-500">
                          {data.condition} · {data.trend}
                        </div>
                        <div className={`text-xs font-medium ${data.anomaly < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {data.anomaly > 0 ? '+' : ''}{data.anomaly}% anomaly
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* API Links */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">API Endpoints (all FREE, no key needed)</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <a href={`/api/prices?country=${country}`} className="text-blue-600 hover:underline">GET /api/prices?country={country}</a>
                  <a href={`/api/climate/weather?country=${country}`} className="text-blue-600 hover:underline">GET /api/climate/weather?country={country}</a>
                  <a href={`/api/climate/alerts?country=${country}`} className="text-blue-600 hover:underline">GET /api/climate/alerts?country={country}</a>
                  <a href={`/api/climate/watch?summary=true`} className="text-blue-600 hover:underline">GET /api/climate/watch?summary=true</a>
                  <a href={`/api/climate/forecast`} className="text-blue-600 hover:underline">GET /api/climate/forecast</a>
                  <a href={`/api/production?country=${country}`} className="text-blue-600 hover:underline">GET /api/production?country={country}</a>
                  <a href={`/api/indicators?country=${country}`} className="text-blue-600 hover:underline">GET /api/indicators?country={country}</a>
                  <a href={`/api/advisory?country=${country}&crop=maize`} className="text-blue-600 hover:underline">GET /api/advisory?country={country}&crop=maize</a>
                </div>
              </div>
            </>
          )}
        </main>

        <footer className="bg-gray-900 text-gray-400 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm">
            KilimoPRO 2.0 — AI-Powered Agricultural Intelligence for 8 IGAD Countries 🌍<br />
            Data: FAOSTAT · ICPAC · Open-Meteo · World Bank (all free, no API keys)
          </div>
        </footer>
      </div>
    </>
  );
}
