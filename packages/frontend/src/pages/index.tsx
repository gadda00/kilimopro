/**
 * kilimo.pro — Landing Page
 * KilimoPRO: AI-Powered Agricultural Intelligence for Kenya & Africa
 */

import { Sparkles, Zap, Globe, Brain, Droplet, TrendingUp, Bug, MapPin, MessageSquare, Download, ArrowRight, Check } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-50 to-white" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl" />
        
        <div className="container mx-auto px-4 relative max-w-6xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Agricultural Intelligence
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
              Kilimo<span className="text-green-600">PRO</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              From soil to satellite, from farm to market. KilimoPRO delivers
              AI-powered agricultural intelligence to every Kenyan farmer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#download" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors">
                <Download className="w-5 h-5" />
                Get the App
              </a>
              <a href="#features" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border-2 border-gray-200 font-semibold hover:border-green-400 transition-colors">
                Explore Features
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-green-600">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: '5M+', label: 'Target Farmers' },
              { value: '100+', label: 'Markets Tracked' },
              { value: '26+', label: 'Crop Diseases' },
              { value: '15+', label: 'Data Sources' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-green-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Intelligence for every farming decision</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ten powerful modules working together to help you grow more, earn more, and farm smarter.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'Weather Intelligence', desc: 'Hyperlocal 7-day forecasts with actionable farming recommendations. Frost, rain, and dry spell alerts.', color: 'bg-blue-50 text-blue-600' },
              { icon: Bug, title: 'Crop Disease Detection', desc: 'Point your phone at a leaf. AI identifies the disease in seconds — works offline.', color: 'bg-red-50 text-red-600' },
              { icon: TrendingUp, title: 'Market Intelligence', desc: 'Real-time prices from 100+ markets. Price forecasts and best-market recommendations.', color: 'bg-green-50 text-green-600' },
              { icon: MapPin, title: 'Soil Health', desc: 'Soil type, fertility score, and personalized amendment recommendations.', color: 'bg-amber-50 text-amber-600' },
              { icon: Droplet, title: 'Irrigation Scheduler', desc: 'Optimal irrigation scheduling based on weather and crop water needs.', color: 'bg-cyan-50 text-cyan-600' },
              { icon: Brain, title: 'AI Advisory', desc: 'Personalized crop management recommendations based on your farm and conditions.', color: 'bg-purple-50 text-purple-600' },
              { icon: Zap, title: 'Pest Early Warning', desc: 'Community-driven pest outbreak detection. Get alerts before pests reach your farm.', color: 'bg-orange-50 text-orange-600' },
              { icon: MessageSquare, title: 'Ask KilimoPRO', desc: 'Natural language Q&A in Swahili and English. Just ask, get answers.', color: 'bg-indigo-50 text-indigo-600' },
              { icon: Globe, title: 'Climate Risk', desc: 'Long-term climate risk assessment with adaptation strategies for your farm.', color: 'bg-teal-50 text-teal-600' },
            ].map((feature) => (
              <div key={feature.title} className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Powered by real data</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              'KilimoSTAT', 'FAOSTAT API', 'KALRO Platform', 'Google Earth Engine',
              'Sentinel-2 Satellite', 'CHIRPS Rainfall', 'AIRC Market Prices', 'Africa\'s Talking',
            ].map((source) => (
              <div key={source} className="p-4 bg-white rounded-xl border border-gray-100 text-center">
                <div className="text-sm font-medium text-gray-700">{source}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="py-24 bg-green-600 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Start farming smarter today</h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Free for all Kenyan farmers. Available on Android. Works offline.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-green-600 font-semibold hover:bg-green-50 transition-colors">
              <Download className="w-5 h-5" />
              Download for Android
            </a>
            <a href="#" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border-2 border-white text-white font-semibold hover:bg-green-700 transition-colors">
              Use Web Version
            </a>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-green-100">
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Free for farmers</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Works offline</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Swahili & English</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> SMS & USSD fallback</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <div className="text-xl font-bold text-white mb-1">KilimoPRO</div>
              <div className="text-sm">AI-Powered Agricultural Intelligence</div>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white">About</a>
              <a href="#" className="hover:text-white">API Docs</a>
              <a href="#" className="hover:text-white">Partnerships</a>
              <a href="mailto:mututandunda@gmail.com" className="hover:text-white">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>© 2026 KilimoPRO. Built in Nairobi, Kenya 🇰🇪</p>
            <p className="mt-2">kilimo.pro · mututandunda@gmail.com · +254 724 346 971</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
