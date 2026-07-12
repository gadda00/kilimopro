import { useEffect, useState } from 'react';
import { TrendingUp, Download } from 'lucide-react';
import { DataAggregator } from '@/lib/data/aggregator';
import { IGAD } from '@/lib/data/constants';
import type { MarketPriceData } from '@/lib/data/faostat';

export default function MarketPage({ country }: { country: string }) {
  const [prices, setPrices] = useState<MarketPriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [crop, setCrop] = useState('');

  useEffect(() => {
    setLoading(true);
    DataAggregator.getMarketPrices(country, crop || undefined).then(p => {
      setPrices(p);
      setLoading(false);
    });
  }, [country, crop]);

  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];
  const crops = Object.keys(IGAD.CROPS);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Prices — {countryInfo?.flag} {countryInfo?.name}</h1>
          <p className="text-gray-500 text-sm">Data from FAOSTAT · Free</p>
        </div>
        <a
          href={`/api/prices?country=${country}${crop ? `&crop=${crop}` : ''}&format=csv`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
        >
          <Download className="w-4 h-4" /> CSV
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
        <div className="p-8 text-center text-gray-500">Loading prices...</div>
      ) : prices.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No price data available for {countryInfo?.name}. Try another country or crop.</p>
        </div>
      ) : (
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
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 capitalize">{p.crop}</td>
                  <td className="px-4 py-3 text-gray-500">{p.year}</td>
                  <td className="px-4 py-3 text-right font-semibold">{p.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                  <td className="px-4 py-3 text-gray-500">{p.currency}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">{p.source}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
