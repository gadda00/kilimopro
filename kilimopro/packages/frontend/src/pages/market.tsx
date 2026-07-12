import { useEffect, useState } from 'react';
import { TrendingUp, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { DataAggregator } from '@/lib/data/aggregator';
import { IGAD } from '@/lib/data/constants';
import type { MarketPriceData } from '@/lib/data/faostat';

export default function MarketPage({ country }: { country: string }) {
  const [prices, setPrices] = useState<MarketPriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crop, setCrop] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    DataAggregator.getMarketPrices(country, crop || undefined).then(p => {
      setPrices(p);
      setLoading(false);
    }).catch(() => {
      setError('Could not load market prices.');
      setLoading(false);
    });
  }, [country, crop]);

  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];
  const crops = Object.keys(IGAD.CROPS);

  // Chart data: prices by crop
  const chartData = prices.map(p => ({
    name: p.crop.split(',')[0].charAt(0).toUpperCase() + p.crop.split(',')[0].slice(1),
    price: p.price,
    currency: p.currency,
    unit: p.unit,
  })).sort((a, b) => b.price - a.price);

  const maxPrice = Math.max(...chartData.map(d => d.price), 1);

  const getBarColor = (price: number) => {
    const ratio = price / maxPrice;
    if (ratio > 0.7) return '#ef4444'; // red — expensive
    if (ratio > 0.4) return '#f59e0b'; // amber — moderate
    return '#22c55e'; // green — cheap
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Prices — {countryInfo?.flag} {countryInfo?.name}</h1>
          <p className="text-gray-500 text-sm">Data from FAOSTAT · {prices.length} commodities</p>
        </div>
        <a
          href={`/api/prices?country=${country}${crop ? `&crop=${crop}` : ''}&format=csv`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
        >
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      {/* Crop filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCrop('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${!crop ? 'bg-kilimo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          All Crops
        </button>
        {crops.map(c => (
          <button
            key={c}
            onClick={() => setCrop(c)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${crop === c ? 'bg-kilimo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-kilimo-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-3">⚠️ {error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-kilimo-600 text-white text-sm">Retry</button>
        </div>
      ) : prices.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No price data available for {countryInfo?.name}.</p>
        </div>
      ) : (
        <>
          {/* Price chart */}
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border p-5 shadow-sm mb-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-kilimo-600" /> Price Comparison by Crop
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    formatter={(value: any) => [`${value} ${chartData[0]?.currency || ''}`, 'Price']}
                    labelFormatter={(label: any) => `Crop: ${label}`}
                  />
                  <Bar dataKey="price" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.price)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500" /> Low price</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-500" /> Moderate</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500" /> High price</span>
              </div>
            </motion.div>
          )}

          {/* Price table */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Crop</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 capitalize">{p.crop}</td>
                    <td className="px-4 py-3 text-gray-500">{p.year}</td>
                    <td className="px-4 py-3 text-right font-semibold">{p.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                    <td className="px-4 py-3 text-gray-500">{p.currency}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">{p.source}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SMS hint */}
          <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-800">
            💡 Get prices on your phone: send an SMS with a crop name (e.g., "MAIZE") to the KilimoPRO number.
          </div>
        </>
      )}
    </div>
  );
}
