import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Droplet, Sprout, TrendingDown, TrendingUp, Minus, Loader2, Calendar } from 'lucide-react';
import { DataAggregator } from '@/lib/data/aggregator';
import { IGAD, getCurrentSeason } from '@/lib/data/constants';

const CROP_CONDITION_STYLES: Record<string, { bg: string; text: string; emoji: string }> = {
  excellent: { bg: 'bg-green-100', text: 'text-green-700', emoji: '🌟' },
  good: { bg: 'bg-green-50', text: 'text-green-600', emoji: '✅' },
  fair: { bg: 'bg-yellow-50', text: 'text-yellow-600', emoji: '⚠️' },
  poor: { bg: 'bg-red-50', text: 'text-red-600', emoji: '❌' },
};

const TREND_ICONS: Record<string, any> = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const TREND_COLORS: Record<string, string> = {
  improving: 'text-green-600',
  stable: 'text-gray-500',
  declining: 'text-red-600',
};

export default function WatchPage({ country }: { country: string }) {
  const [watch, setWatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    DataAggregator.getAgricultureWatch().then(w => {
      setWatch(w);
      setLoading(false);
    }).catch(() => {
      setError('Could not load agriculture watch data.');
      setLoading(false);
    });
  }, []);

  const currentSeason = getCurrentSeason();
  const seasonName = IGAD.SEASONS[currentSeason as keyof typeof IGAD.SEASONS]?.name || currentSeason;
  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-kilimo-500" />
    </div>
  );
  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      <p className="text-red-500 mb-3">⚠️ {error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-kilimo-600 text-white text-sm">Retry</button>
    </div>
  );
  if (!watch) return <div className="p-8 text-center text-gray-500">No data available</div>;

  const cropEntries = Object.entries(watch.crops || {});
  const rangelandEntries = Object.entries(watch.rangeland || {});
  const rainfallAnomalies = Object.entries(watch.rainfall?.anomalies || {});
  const rainfallPct = Object.entries(watch.rainfall?.percentOfNormal || {});
  const soilMoisture = Object.entries(watch.soilMoisture || {});
  const vegIndex = Object.entries(watch.vegetationIndex || {});

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-kilimo-600" /> Agriculture Watch
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          ICPAC monthly agricultural conditions · Current season: {seasonName} · {countryInfo?.flag} {countryInfo?.name}
        </p>
      </motion.div>

      {/* Summary banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6 p-4 rounded-xl bg-gradient-to-r from-kilimo-600 to-kilimo-700 text-white"
      >
        <p className="text-sm">{watch.summary}</p>
        <p className="text-xs text-green-200 mt-1">Last updated: {watch.date}</p>
      </motion.div>

      {/* Crop conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border p-5 shadow-sm mb-6"
      >
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sprout className="w-5 h-5 text-green-500" /> Crop Conditions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cropEntries.map(([crop, data]: [string, any], i) => {
            const style = CROP_CONDITION_STYLES[data.condition] || CROP_CONDITION_STYLES.fair;
            const TrendIcon = TREND_ICONS[data.trend] || Minus;
            return (
              <motion.div
                key={crop}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className={`p-3 rounded-xl ${style.bg} border`}
              >
                <div className="text-2xl mb-1">{style.emoji}</div>
                <div className="text-sm font-medium capitalize text-gray-900">{crop}</div>
                <div className={`text-xs font-medium ${style.text}`}>{data.condition}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendIcon className={`w-3 h-3 ${TREND_COLORS[data.trend] || 'text-gray-400'}`} />
                  <span className="text-xs text-gray-500">{data.trend}</span>
                </div>
                <div className={`text-xs font-bold mt-1 ${data.anomaly < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {data.anomaly > 0 ? '+' : ''}{data.anomaly}% anomaly
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Rainfall anomalies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border p-5 shadow-sm mb-6"
      >
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Droplet className="w-5 h-5 text-blue-500" /> Rainfall by Region
        </h3>
        <div className="space-y-3">
          {rainfallAnomalies.map(([region, anomaly]: [string, any], i) => {
            const pct = rainfallPct.find((entry: any) => entry[0] === region)?.[1] || 100;
            const isBelow = anomaly < 0;
            return (
              <div key={region} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 capitalize w-24">{region}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Number(pct), 150) / 1.5}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                    className={`h-full rounded-full ${isBelow ? 'bg-amber-400' : 'bg-blue-500'}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {String(pct)}% of normal
                  </div>
                </div>
                <span className={`text-sm font-bold w-16 text-right ${isBelow ? 'text-red-500' : 'text-green-500'}`}>
                  {anomaly > 0 ? '+' : ''}{anomaly}%
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Soil moisture + vegetation index */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border p-5 shadow-sm"
        >
          <h3 className="font-semibold text-gray-900 mb-3">Soil Moisture</h3>
          <div className="space-y-2">
            {soilMoisture.map(([region, value]: [string, any]) => (
              <div key={region} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{region}</span>
                <span className={`font-medium ${value < 40 ? 'text-red-500' : value < 60 ? 'text-amber-500' : 'text-green-500'}`}>
                  {value}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border p-5 shadow-sm"
        >
          <h3 className="font-semibold text-gray-900 mb-3">Vegetation Index (NDVI)</h3>
          <div className="space-y-2">
            {vegIndex.map(([region, value]: [string, any]) => (
              <div key={region} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{region}</span>
                <span className={`font-medium ${value < 0.4 ? 'text-red-500' : value < 0.6 ? 'text-amber-500' : 'text-green-500'}`}>
                  {value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Rangeland conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl border p-5 shadow-sm"
      >
        <h3 className="font-semibold text-gray-900 mb-3">Rangeland Conditions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {rangelandEntries.map(([region, condition]: [string, any]) => {
            const style = CROP_CONDITION_STYLES[condition] || CROP_CONDITION_STYLES.fair;
            return (
              <div key={region} className={`p-2 rounded-lg ${style.bg} text-center`}>
                <div className="text-sm font-medium capitalize text-gray-700">{region}</div>
                <div className={`text-xs ${style.text}`}>{condition}</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* API link */}
      <div className="mt-4 text-center">
        <a
          href="/api/climate/watch"
          className="text-sm text-blue-600 hover:underline"
        >
          View raw API data →
        </a>
      </div>
    </div>
  );
}
