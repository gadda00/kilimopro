import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Sun, TrendingDown, TrendingUp, Loader2, Thermometer, Droplet } from 'lucide-react';
import { DataAggregator } from '@/lib/data/aggregator';
import { IGAD, getCurrentSeason } from '@/lib/data/constants';
import type { ICPACClimateForecast } from '@/lib/data/icpac';

export default function ForecastPage({ country }: { country: string }) {
  const [forecasts, setForecasts] = useState<ICPACClimateForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    DataAggregator.getClimateForecast().then(f => {
      setForecasts(f);
      setLoading(false);
    }).catch(() => {
      setError('Could not load climate forecast.');
      setLoading(false);
    });
  }, []);

  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];
  const currentSeason = getCurrentSeason();
  const seasonName = IGAD.SEASONS[currentSeason as keyof typeof IGAD.SEASONS]?.name || currentSeason;

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );
  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      <p className="text-red-500 mb-3">⚠️ {error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-kilimo-600 text-white text-sm">Retry</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CloudRain className="w-6 h-6 text-blue-500" /> Seasonal Forecast
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          ICPAC climate outlook · {countryInfo?.flag} {countryInfo?.name} · {seasonName}
        </p>
      </motion.div>

      {forecasts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl text-gray-500">No forecast data available.</div>
      ) : (
        <div className="space-y-4">
          {forecasts.map((forecast, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl border p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{forecast.season}</h3>
                  <p className="text-xs text-gray-500">{forecast.period}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    forecast.confidence === 'high' ? 'bg-green-100 text-green-700' :
                    forecast.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {forecast.confidence} confidence
                  </span>
                  <span className="text-xs text-gray-400">{forecast.probability}% probability</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {/* Temperature */}
                <div className="p-3 rounded-lg bg-orange-50">
                  <Thermometer className="w-4 h-4 text-orange-500 mb-1" />
                  <div className="text-xs text-gray-500">Temperature</div>
                  <div className="text-lg font-bold text-gray-900">
                    {forecast.temperature.min}–{forecast.temperature.max}°C
                  </div>
                  <div className="text-xs text-gray-500">Avg: {forecast.temperature.avg}°C</div>
                  <div className={`text-xs font-medium ${forecast.temperature.anomaly > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {forecast.temperature.anomaly > 0 ? '+' : ''}{forecast.temperature.anomaly}°C anomaly
                  </div>
                </div>

                {/* Rainfall */}
                <div className="p-3 rounded-lg bg-blue-50">
                  <Droplet className="w-4 h-4 text-blue-500 mb-1" />
                  <div className="text-xs text-gray-500">Rainfall</div>
                  <div className="text-lg font-bold text-gray-900">{forecast.rainfall.total}mm</div>
                  <div className="text-xs text-gray-500">{forecast.rainfall.percentOfNormal}% of normal</div>
                  <div className={`text-xs font-medium ${forecast.rainfall.anomaly < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {forecast.rainfall.anomaly > 0 ? '+' : ''}{forecast.rainfall.anomaly}% anomaly
                  </div>
                </div>

                {/* Probability */}
                <div className="p-3 rounded-lg bg-purple-50">
                  <CloudRain className="w-4 h-4 text-purple-500 mb-1" />
                  <div className="text-xs text-gray-500">Probability</div>
                  <div className="text-lg font-bold text-gray-900">{forecast.probability}%</div>
                  <div className="text-xs text-gray-500">forecast confidence</div>
                </div>

                {/* Region */}
                <div className="p-3 rounded-lg bg-gray-50">
                  <Sun className="w-4 h-4 text-gray-400 mb-1" />
                  <div className="text-xs text-gray-500">Region</div>
                  <div className="text-sm font-bold text-gray-900">{forecast.region}</div>
                  <div className="text-xs text-gray-500">Issued: {forecast.issuedDate}</div>
                </div>
              </div>

              {/* Visual indicators */}
              <div className="flex items-center gap-4 pt-3 border-t">
                <div className="flex items-center gap-1">
                  {forecast.rainfall.anomaly < 0 ? (
                    <><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-xs text-red-600">Below normal rainfall</span></>
                  ) : (
                    <><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-xs text-green-600">Above normal rainfall</span></>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {forecast.temperature.anomaly > 1 ? (
                    <><TrendingUp className="w-4 h-4 text-orange-500" /><span className="text-xs text-orange-600">Warmer than average</span></>
                  ) : (
                    <span className="text-xs text-gray-500">Near-normal temperature</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Advisory based on forecast */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200"
      >
        <h3 className="font-semibold text-amber-800 mb-2">📋 Farmer Advisory</h3>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Plant drought-resistant varieties if below-normal rainfall is forecast</li>
          <li>• Prepare water harvesting structures (ponds, tanks) before the season</li>
          <li>• Adjust planting dates based on rainfall onset (±2 weeks from normal)</li>
          <li>• Monitor ICPAC updates monthly for forecast revisions</li>
          <li>• Diversify crops to spread risk — don't plant all maize</li>
        </ul>
      </motion.div>
    </div>
  );
}
