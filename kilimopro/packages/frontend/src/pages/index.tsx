import Link from 'next/link';
import { CloudRain, TrendingUp, AlertTriangle, Brain, Camera, BookOpen, Users, Zap, Globe } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { IGAD } from '@/lib/data/constants';

export default function Home({ country }: { country: string }) {
  const { t } = useLang();
  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];

  const stats = [
    { label: t('hero.stats.farmers'), value: '300M+', icon: Users },
    { label: t('hero.stats.alerts'), value: '1M+', icon: Zap },
    { label: t('hero.stats.yield'), value: '18%', icon: TrendingUp },
    { label: t('hero.stats.data'), value: '10M+', icon: Globe },
  ];

  const features = [
    { icon: CloudRain, title: 'Weather Intelligence', desc: 'Free 16-day forecasts from Open-Meteo for all 8 IGAD countries', href: '/weather', color: 'bg-blue-50 text-blue-600' },
    { icon: AlertTriangle, title: 'Climate Alerts', desc: 'ICPAC drought, flood, pest & locust alerts with mitigation measures', href: '/alerts', color: 'bg-amber-50 text-amber-600' },
    { icon: TrendingUp, title: 'Market Prices', desc: 'FAOSTAT market prices for 15 crops across 8 countries', href: '/market', color: 'bg-green-50 text-green-600' },
    { icon: Brain, title: 'Ask KilimoPRO', desc: 'AI-powered advisory in Swahili & English', href: '/chat', color: 'bg-purple-50 text-purple-600' },
    { icon: Camera, title: 'Disease Detection', desc: 'AI crop disease detection from a leaf photo', href: '/disease', color: 'bg-red-50 text-red-600' },
    { icon: BookOpen, title: 'Learning Hub', desc: 'Farming best practices and educational content', href: '/education', color: 'bg-teal-50 text-teal-600' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-b from-kilimo-50 to-white">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-6">
            <Globe className="w-4 h-4" />
            Now serving 8 IGAD countries: {countryInfo?.flag} {countryInfo?.name}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
            Kilimo<span className="text-kilimo-600">PRO</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('hero.subtitle')}. Free weather, market prices, climate alerts, and AI advisory — no API keys, no cost.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/weather" className="px-8 py-3 rounded-xl bg-kilimo-600 text-white font-semibold hover:bg-kilimo-700 transition-colors">
              {t('hero.cta')}
            </Link>
            <Link href="/alerts" className="px-8 py-3 rounded-xl border-2 border-gray-200 font-semibold hover:border-kilimo-400 transition-colors">
              View Alerts
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-kilimo-600 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label}>
                  <Icon className="w-8 h-8 mx-auto mb-2 text-green-200" />
                  <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-green-100">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Intelligence for every farming decision</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Six powerful modules powered by free data sources — FAOSTAT, ICPAC, Open-Meteo, and World Bank.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow bg-white"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data sources */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Powered by free data sources</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['FAOSTAT', 'ICPAC', 'Open-Meteo', 'World Bank'].map((source) => (
              <div key={source} className="p-4 bg-white rounded-xl border border-gray-100 text-center">
                <div className="text-sm font-medium text-gray-700">{source}</div>
                <div className="text-xs text-green-600 mt-1">Free · No API key</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IGAD countries */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Serving 8 IGAD Countries</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(IGAD.COUNTRIES).map(([code, c]) => (
              <div key={code} className="px-4 py-2 rounded-full bg-gray-50 border border-gray-100 text-sm">
                <span className="text-xl mr-1">{c.flag}</span>
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
