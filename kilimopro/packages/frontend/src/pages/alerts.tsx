import { useEffect, useState } from 'react';
import { AlertTriangle, Droplet, Bug, CloudRain, Wind } from 'lucide-react';
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

  useEffect(() => {
    DataAggregator.getHazardAlerts(country).then(a => {
      setAlerts(a);
      setLoading(false);
    });
  }, [country]);

  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading alerts...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Climate Alerts — {countryInfo?.flag} {countryInfo?.name}</h1>
      <p className="text-gray-500 mb-6 text-sm">Data from ICPAC · Free</p>

      {alerts.length === 0 ? (
        <div className="text-center py-16 bg-green-50 rounded-xl">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-lg font-medium text-green-700">No active alerts. Conditions look good!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = TYPE_ICONS[alert.type] || AlertTriangle;
            return (
              <div key={alert.id} className={`p-4 rounded-xl border-2 ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.moderate}`}>
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
                    <div className="font-medium mb-1">Mitigation:</div>
                    <ul className="list-disc list-inside space-y-0.5 opacity-80">
                      {alert.mitigationMeasures.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
