import { useEffect, useState } from 'react';
import { AlertTriangle, Droplet, Bug, CloudRain, Map as MapIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { DataAggregator } from '@/lib/data/aggregator';
import { IGAD } from '@/lib/data/constants';
import type { ICPACAlert } from '@/lib/data/icpac';

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-green-50 border-green-200 text-green-800',
  moderate: 'bg-amber-50 border-amber-200 text-amber-800',
  high: 'bg-orange-50 border-orange-200 text-orange-800',
  extreme: 'bg-red-50 border-red-200 text-red-800',
};

const TYPE_ICONS: Record<string, any> = {
  drought: Droplet, flood: CloudRain, pest: Bug, rainfall: CloudRain, locust: Bug,
};

export default function AlertsPage({ country }: { country: string }) {
  const [alerts, setAlerts] = useState<ICPACAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    DataAggregator.getHazardAlerts(country).then(a => {
      setAlerts(a);
      setLoading(false);
    }).catch(() => {
      setError('Could not load climate alerts.');
      setLoading(false);
    });
  }, [country]);

  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];

  // Count by severity
  const severityCounts = alerts.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Climate Alerts — {countryInfo?.flag} {countryInfo?.name}</h1>
          <p className="text-gray-500 text-sm">Data from ICPAC · Free</p>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
          >
            <MapIcon className="w-4 h-4" /> {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-3">⚠️ {error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-kilimo-600 text-white text-sm">Retry</button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-green-50 rounded-xl">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-lg font-medium text-green-700">No active alerts. Conditions look good!</p>
        </div>
      ) : (
        <>
          {/* Severity summary */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {['extreme', 'high', 'moderate', 'low'].map(sev => (
              <div key={sev} className={`p-3 rounded-xl border-2 ${SEVERITY_STYLES[sev] || ''} text-center`}>
                <div className="text-2xl font-bold">{severityCounts[sev] || 0}</div>
                <div className="text-xs capitalize">{sev}</div>
              </div>
            ))}
          </div>

          {/* Dynamic map */}
          {showMap && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-6 overflow-hidden rounded-xl"
            >
              <div className="bg-white rounded-xl border p-1">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=25,5,50,-5&layer=mapnik&marker=${IGAD.COORDS[country as keyof typeof IGAD.COORDS]?.[0] || -1},${IGAD.COORDS[country as keyof typeof IGAD.COORDS]?.[1] || 36}`}
                  className="w-full h-80 rounded-lg border-0"
                  title="Climate Map"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">Alert locations shown on IGAD region map</p>
            </motion.div>
          )}

          {/* Alert cards */}
          <div className="space-y-3">
            {alerts.map((alert, i) => {
              const Icon = TYPE_ICONS[alert.type] || AlertTriangle;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`p-4 rounded-xl border-2 ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.moderate}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold">{alert.title}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 font-medium capitalize">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm mb-2 opacity-80">{alert.description}</p>
                  {alert.advisory && (
                    <div className="text-sm bg-white/30 rounded p-2 mb-2">💡 {alert.advisory}</div>
                  )}
                  {alert.mitigationMeasures && alert.mitigationMeasures.length > 0 && (
                    <div className="text-xs">
                      <div className="font-medium mb-1">Mitigation measures:</div>
                      <ul className="list-disc list-inside space-y-0.5 opacity-80">
                        {alert.mitigationMeasures.map((m, j) => <li key={j}>{m}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="text-xs mt-2 opacity-60 flex items-center gap-2">
                    <span>📍 {alert.countries.join(', ')}</span>
                    <span>·</span>
                    <span>Source: {alert.source}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
