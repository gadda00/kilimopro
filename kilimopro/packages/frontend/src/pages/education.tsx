import { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';

const CATEGORIES = ['Planting', 'Harvesting', 'Fertilizer', 'Pest Control', 'Irrigation', 'Best Practices'];

const ARTICLES = [
  { id: 1, title: 'Drought-Resistant Farming Techniques', category: 'Best Practices', emoji: '🌾', desc: 'Water conservation methods for dry seasons.' },
  { id: 2, title: 'Fall Armyworm Control in Maize', category: 'Pest Control', emoji: '🐛', desc: 'Early detection and control strategies.' },
  { id: 3, title: 'When to Plant Maize (IGAD Calendar)', category: 'Planting', emoji: '🌱', desc: 'Seasonal planting guide for 8 IGAD countries.' },
  { id: 4, title: 'NPK Fertilizer Application Guide', category: 'Fertilizer', emoji: '🧪', desc: 'How and when to apply fertilizer for max yield.' },
  { id: 5, title: 'Post-Harvest Storage with Hermetic Bags', category: 'Harvesting', emoji: '📦', desc: 'Prevent weevil damage with PICS bags.' },
  { id: 6, title: 'Drip Irrigation for Smallholders', category: 'Irrigation', emoji: '💧', desc: 'Water-efficient irrigation for small farms.' },
];

export default function EducationPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = ARTICLES.filter(a =>
    (category === 'All' || a.category === category) &&
    (a.title.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-teal-600" /> Learning Hub
      </h1>
      <p className="text-gray-500 mb-6 text-sm">Farming best practices for IGAD farmers</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:border-kilimo-500"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All', ...CATEGORIES].map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${category === c ? 'bg-kilimo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(a => (
          <div key={a.id} className="p-5 rounded-xl border hover:shadow-md transition-shadow bg-white">
            <div className="text-3xl mb-2">{a.emoji}</div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">{a.category}</span>
            <h3 className="font-semibold text-gray-900 mt-2 mb-1">{a.title}</h3>
            <p className="text-sm text-gray-600">{a.desc}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">No articles found. Try a different search.</div>
      )}
    </div>
  );
}
