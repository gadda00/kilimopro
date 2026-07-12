import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, TrendingUp, AlertTriangle, Brain, Camera, BookOpen, Users, Zap, Globe, ArrowRight, Sun, Droplet, Wind } from 'lucide-react';
import CountUp from 'react-countup';
import { useLang } from '@/lib/i18n';
import { IGAD, getCountryCoordinates } from '@/lib/data/constants';
import { DataAggregator } from '@/lib/data/aggregator';

export default function Home({ country }: { country: string }) {
  const { t } = useLang();
  const countryInfo = IGAD.COUNTRIES[country as keyof typeof IGAD.COUNTRIES];
  const [liveTemp, setLiveTemp] = useState<number | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<number | null>(null);

  // Fetch real live data for the hero
  useEffect(() => {
    const [lat, lon] = getCountryCoordinates(country);
    DataAggregator.getWeather(lat, lon, 1).then(w => {
      setLiveTemp(Math.round(w.current.temperature));
    });
    DataAggregator.getHazardAlerts(country).then(a => {
      setLiveAlerts(a.length);
    });
  }, [country]);

  const features = [
    { icon: CloudRain, title: 'Weather', desc: 'Free 16-day forecasts', href: '/weather', color: 'from-blue-500 to-cyan-500' },
    { icon: AlertTriangle, title: 'Climate Alerts', desc: 'Drought, flood & pest warnings', href: '/alerts', color: 'from-amber-500 to-orange-500' },
    { icon: TrendingUp, title: 'Market Prices', desc: 'FAOSTAT crop prices', href: '/market', color: 'from-green-500 to-emerald-500' },
    { icon: Brain, title: 'Ask AI', desc: 'Smart farming advisor', href: '/chat', color: 'from-purple-500 to-violet-500' },
    { icon: Camera, title: 'Disease Detection', desc: 'AI leaf analysis', href: '/disease', color: 'from-red-500 to-rose-500' },
    { icon: BookOpen, title: 'Learning Hub', desc: 'Farming best practices', href: '/education', color: 'from-teal-500 to-cyan-500' },
  ];

  return (
    <div>
      {/* Hero Section with live data */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-br from-kilimo-700 via-kilimo-600 to-kilimo-800 text-white">
        {/* Animated background blobs */}
        <motion.div
          className="absolute top-10 left-10 w-72 h-72 bg-green-400 rounded-full opacity-20 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-40 right-10 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-400"
              />
              LIVE · Serving {countryInfo?.flag} {countryInfo?.name} · {liveTemp !== null && `${liveTemp}°C now`}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-4"
            >
              Kilimo<span className="text-green-300">PRO</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-green-100 mb-2 max-w-3xl mx-auto"
            >
              {t('hero.subtitle')}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-green-200 mb-8"
            >
              All data sources free. No API keys. Zero cost.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/weather">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 rounded-xl bg-white text-kilimo-700 font-bold cursor-pointer flex items-center gap-2"
                >
                  {t('hero.cta')} <ArrowRight className="w-4 h-4" />
                </motion.div>
              </Link>
              <Link href="/chat">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 rounded-xl border-2 border-white/30 backdrop-blur-sm text-white font-semibold cursor-pointer"
                >
                  Ask AI Advisor
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* Live stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: Globe, label: 'IGAD Countries', value: 8, suffix: '' },
              { icon: Users, label: 'People Served', value: 300, suffix: 'M+' },
              { icon: Zap, label: 'Active Alerts', value: liveAlerts ?? 0, suffix: '' },
              { icon: Sun, label: 'Live Temp', value: liveTemp ?? 0, suffix: '°C' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center"
                >
                  <Icon className="w-5 h-5 mx-auto mb-2 text-green-300" />
                  <div className="text-2xl font-bold">
                    {stat.value !== null && <CountUp end={stat.value} duration={1.5} />}
                    {stat.suffix}
                  </div>
                  <div className="text-xs text-green-200">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-gray-900 mb-4"
          >
            Everything a farmer needs, in one app
          </motion.h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Powered by 4 free data sources — no API keys, no cost, just real intelligence.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={feature.href}>
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="p-6 rounded-2xl border border-gray-100 hover:shadow-xl transition-shadow bg-white h-full cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                      <div className="mt-3 text-xs text-kilimo-600 font-medium flex items-center gap-1">
                        Open <ArrowRight className="w-3 h-3" />
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data sources */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Powered by free data</h2>
          <p className="text-gray-500 text-sm mb-8">No API keys. No subscriptions. No cost. Ever.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Open-Meteo', desc: 'Weather forecasts', icon: Sun },
              { name: 'FAOSTAT', desc: 'Market prices', icon: TrendingUp },
              { name: 'ICPAC', desc: 'Climate alerts', icon: AlertTriangle },
              { name: 'World Bank', desc: 'Economic data', icon: Globe },
            ].map((src, i) => {
              const Icon = src.icon;
              return (
                <motion.div
                  key={src.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-white rounded-xl border text-center"
                >
                  <Icon className="w-6 h-6 mx-auto mb-2 text-kilimo-600" />
                  <div className="text-sm font-semibold text-gray-900">{src.name}</div>
                  <div className="text-xs text-gray-500">{src.desc}</div>
                  <div className="text-xs text-green-600 mt-1 font-medium">FREE</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* IGAD countries */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">8 IGAD Countries</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(IGAD.COUNTRIES).map(([code, c], i) => (
              <motion.div
                key={code}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="px-4 py-2 rounded-full bg-gray-50 border border-gray-100 text-sm flex items-center gap-2"
              >
                <span className="text-xl">{c.flag}</span>
                {c.name}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
