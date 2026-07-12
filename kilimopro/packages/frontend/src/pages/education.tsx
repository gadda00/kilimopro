import { useState, useEffect } from 'react';
import { BookOpen, Search, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Article {
  id: string;
  title: string;
  category: string;
  emoji: string;
  desc: string;
  content?: string;
  expanded?: boolean;
}

const CATEGORIES = ['All', 'Planting', 'Harvesting', 'Fertilizer', 'Pest Control', 'Irrigation'];

const CATEGORY_EMOJIS: Record<string, string> = {
  planting: '🌱', harvesting: '🌾', fertilizer: '🧪', pest_control: '🐛', irrigation: '💧', general: '📚',
};

export default function EducationPage({ country }: { country: string }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadArticles() {
      setLoading(true);
      setError(null);
      try {
        // Fetch real advisory content from our API
        const res = await fetch(`/api/advisory?country=${country}&limit=20`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const items = data.advisory || [];

        const mapped: Article[] = items.map((a: any) => ({
          id: a.id,
          title: a.title,
          category: a.type.charAt(0).toUpperCase() + a.type.slice(1).replace('_', ' '),
          emoji: CATEGORY_EMOJIS[a.type] || '📚',
          desc: a.content.slice(0, 120) + '...',
          content: a.content,
        }));

        setArticles(mapped.length > 0 ? mapped : getFallbackArticles());
      } catch (e) {
        setError('Could not load articles. Showing default content.');
        setArticles(getFallbackArticles());
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, [country]);

  function getFallbackArticles(): Article[] {
    return [
      { id: '1', title: 'Drought-Resistant Farming Techniques', category: 'Best Practices', emoji: '🌾', desc: 'Water conservation methods for dry seasons.', content: 'Mulching, drip irrigation, drought-tolerant varieties, rainwater harvesting, and conservation agriculture are key strategies for farming in arid regions of East Africa.' },
      { id: '2', title: 'Fall Armyworm Control in Maize', category: 'Pest Control', emoji: '🐛', desc: 'Early detection and control strategies.', content: 'Scout fields every 3 days. Apply Bt biopesticide at first sign. Use push-pull technology with desmodium. Plant early to avoid peak pest pressure.' },
      { id: '3', title: 'When to Plant Maize (IGAD Calendar)', category: 'Planting', emoji: '🌱', desc: 'Seasonal planting guide for 8 IGAD countries.', content: 'Long rains: March-May. Short rains: October-December. Plant at onset of rains using certified seeds. Spacing: 75cm x 30cm.' },
      { id: '4', title: 'NPK Fertilizer Application Guide', category: 'Fertilizer', emoji: '🧪', desc: 'How and when to apply fertilizer for max yield.', content: 'Apply NPK 23-23-0 at 2 bags/ha at planting. Top-dress with urea (1 bag/ha) at 4 weeks. Conduct soil test every 3 years.' },
      { id: '5', title: 'Post-Harvest Storage with Hermetic Bags', category: 'Harvesting', emoji: '📦', desc: 'Prevent weevil damage with PICS bags.', content: 'Dry grains to 13% moisture. Use PICS hermetic bags for storage. Check every 2 weeks. Reduces post-harvest losses from 30% to 5%.' },
      { id: '6', title: 'Drip Irrigation for Smallholders', category: 'Irrigation', emoji: '💧', desc: 'Water-efficient irrigation for small farms.', content: 'Drip irrigation saves 50-70% water vs flood. Water early morning or late evening. Use mulch to reduce evaporation. Critical periods: germination, flowering, grain filling.' },
    ];
  }

  const filtered = articles.filter(a =>
    (category === 'All' || a.category === category) &&
    (a.title.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-teal-600" /> Learning Hub
      </h1>
      <p className="text-gray-500 mb-6 text-sm">Farming best practices for IGAD farmers · {articles.length} articles</p>

      {error && <p className="text-xs text-amber-600 mb-4">⚠️ {error}</p>}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:border-teal-500"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${category === c ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Articles */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-xl border hover:shadow-md transition-shadow bg-white cursor-pointer"
              onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-3xl mb-2">{a.emoji}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">{a.category}</span>
                  <h3 className="font-semibold text-gray-900 mt-2 mb-1">{a.title}</h3>
                  <p className="text-sm text-gray-600">{a.desc}</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === a.id ? 'rotate-90' : ''}`} />
              </div>
              {expandedId === a.id && a.content && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 pt-3 border-t text-sm text-gray-700"
                >
                  {a.content}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">No articles found. Try a different search.</div>
      )}
    </div>
  );
}
