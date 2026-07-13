import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Globe, TrendingUp, Loader2, Users, Sprout, Droplet, Zap } from 'lucide-react';
import { DataAggregator } from '@/lib/data/aggregator';
import { IGAD } from '@/lib/data/constants';
import type { WorldBankIndicator } from '@/lib/data/worldbank';

const INDICATOR_LABELS: Record<string, string> = {
  'AG.LND.AGRI.ZS': 'Agricultural Land (%)',
  'AG.LND.ARBL.ZS': 'Arable Land (%)',
  'AG.CON.FERT.ZS': 'Fertilizer (kg/ha)',
  'AG.YLD.CREL.KG': 'Cereal Yield (kg/ha)',
  'NV.AGR.TOTL.ZS': 'Agriculture in GDP (%)',
  'SL.AGR.EMPL.ZS': 'Employment in Agri (%)',
  'AG.LND.IRIG.ZS': 'Irrigated Land (%)',
};

const INDICATOR_ICONS: Record<string, any> = {
  'AG.LND.AGRI.ZS': Globe,
  'AG.LND.ARBL.ZS': Sprout,
  'AG.CON.FERT.ZS': Zap,
  'AG.YLD.CREL.KG': TrendingUp,
  'NV.AGR.TOTL.ZS': Users,
  'SL.AGR.EMPL.ZS': Users,
  'AG.LND.IRIG.ZS': Droplet,
};

export default function StatsPage({ country }: { country: string }) {
  const [indicators, setIndicators] = useState<WorldBankIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareData, setCompareData] = useState<Record<string, WorldBankIndicator[]>>({});

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Fetch indicators for selected country
    DataAggregator.getAgricultureIndicators(country).then(data => {
      setIndicators(data);
      setLoading(false);
    }).catch(() => {
      setError('Could not load indicators.');
      setLoading(false);
    });

    // Fetch comparison data for all IGAD countries (cached for 7 days)
    Promise.all(
      Object.keys(IGAD.COUNTRIES).map(c =>
        DataAggregator.getAgricultureIndicators(c).then(d => [c, d] as [string, WorldBankIndicator[]])
      )
    ).then(results => {
      const map: Record<string, WorldBankIndicator[]> = {};
      results.forEach(([c, d]) => { map[c] = d; });
      setCompareData(map);
    }).catch(() => {});
  }, [country]);

  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];

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

  // Get latest value for each indicator
  const latestIndicators = indicators
    .filter(i => INDICATOR_LABELS[i.indicatorCode])
    .reduce((acc, i) => {
      if (!acc[i.indicatorCode] || i.year > acc[i.indicatorCode].year) {
        acc[i.indicatorCode] = i;
      }
      return acc;
    }, {} as Record<string, WorldBankIndicator>);

  const indicatorCards = Object.entries(latestIndicators).map(([code, data]) => ({
    code,
    label: INDICATOR_LABELS[code] || code,
    value: data.value,
    year: data.year,
    icon: INDICATOR_ICONS[code] || TrendingUp,
  }));

  // Build comparison chart data for cereal yield
  const yieldComparison = Object.entries(compareData).map(([cc, data]) => {
    const yieldData = data.find(d => d.indicatorCode === 'AG.YLD.CREL.KG');
    const countryInfo = IGAD.COUNTRIES[cc as keyof typeof IGAD.COUNTRIES];
    return {
      country: countryInfo?.name || cc,
      code: cc,
      flag: countryInfo?.flag || '',
      yield: yieldData?.value || 0,
    };
  }).sort((a, b) => b.yield - a.yield);

  // Build comparison for fertilizer consumption
  const fertilizerComparison = Object.entries(compareData).map(([cc, data]) => {
    const fertData = data.find(d => d.indicatorCode === 'AG.CON.FERT.ZS');
    const countryInfo = IGAD.COUNTRIES[cc as keyof typeof IGAD.COUNTRIES];
    return {
      country: countryInfo?.name || cc,
      flag: countryInfo?.flag || '',
      fertilizer: fertData?.value || 0,
    };
  }).sort((a, b) => b.fertilizer - a.fertilizer);

  // Radar chart data (agricultural profile)
  const radarData = [
    { metric: 'Ag Land', value: latestIndicators['AG.LND.AGRI.ZS']?.value || 0, fullMark: 80 },
    { metric: 'Arable Land', value: latestIndicators['AG.LND.ARBL.ZS']?.value || 0, fullMark: 30 },
    { metric: 'Fertilizer', value: Math.min(latestIndicators['AG.CON.FERT.ZS']?.value || 0, 100), fullMark: 100 },
    { metric: 'Yield', value: Math.min((latestIndicators['AG.YLD.CREL.KG']?.value || 0) / 30, 100), fullMark: 100 },
    { metric: 'Ag GDP', value: latestIndicators['NV.AGR.TOTL.ZS']?.value || 0, fullMark: 50 },
    { metric: 'Employment', value: latestIndicators['SL.AGR.EMPL.ZS']?.value || 0, fullMark: 80 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-500" /> Country Statistics
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          World Bank agricultural indicators · {countryInfo?.flag} {countryInfo?.name}
        </p>
      </motion.div>

      {/* Indicator cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {indicatorCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.code}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border p-4 shadow-sm"
            >
              <Icon className="w-5 h-5 text-blue-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {card.value > 1000 ? (card.value / 1000).toFixed(1) + 'K' : card.value.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{card.year}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Radar chart — agricultural profile */}
      {radarData.some(d => d.value > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border p-5 shadow-sm mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Agricultural Profile — {countryInfo?.name}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} />
              <Radar
                name={countryInfo?.name}
                dataKey="value"
                stroke="#1a6b4c"
                fill="#1a6b4c"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Cereal yield comparison across IGAD */}
      {yieldComparison.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border p-5 shadow-sm mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Cereal Yield Comparison (kg/ha) — All IGAD Countries</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={yieldComparison} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v: any) => [`${v.toLocaleString()} kg/ha`, 'Yield']} />
              <Bar dataKey="yield" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Fertilizer comparison */}
      {fertilizerComparison.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border p-5 shadow-sm mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Fertilizer Consumption (kg/ha) — All IGAD Countries</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={fertilizerComparison} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v: any) => [`${v.toFixed(1)} kg/ha`, 'Fertilizer']} />
              <Bar dataKey="fertilizer" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Raw data table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3">Indicator</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3">Unit</th>
            </tr>
          </thead>
          <tbody>
            {indicators.filter(i => INDICATOR_LABELS[i.indicatorCode]).slice(0, 15).map((ind, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{INDICATOR_LABELS[ind.indicatorCode] || ind.indicatorCode}</td>
                <td className="px-4 py-3 text-gray-500">{ind.year}</td>
                <td className="px-4 py-3 text-right font-semibold">{ind.value.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{ind.unit || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-center">
        <a href={`/api/indicators?country=${country}`} className="text-sm text-blue-600 hover:underline">View raw API data →</a>
      </div>
    </div>
  );
}
