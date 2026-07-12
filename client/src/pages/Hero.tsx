import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Cloud, Zap, TrendingUp, Users } from "lucide-react";

export default function Hero() {
  const { t, language, setLanguage } = useLanguage();
  const [, navigate] = useLocation();

  const stats = [
    { label: "Farmers Served", value: "50K+", icon: Users },
    { label: "Alerts Sent", value: "1M+", icon: Zap },
    { label: "Yield Increase", value: "18%", icon: TrendingUp },
    { label: "Climate Data Points", value: "10M+", icon: Cloud },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header with Language Toggle */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KilimoPRO</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === "en"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("sw")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === "sw"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                SW
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                {t("hero.title")}
              </h2>
              <p className="text-2xl md:text-3xl font-semibold text-green-600 dark:text-green-400">
                {t("hero.subtitle")}
              </p>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl">
              {t("hero.description")}
            </p>

            <p className="text-base text-gray-700 dark:text-gray-200 max-w-xl italic border-l-4 border-green-600 pl-4">
              "{t("hero.mission")}"
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => navigate("/map")}
              >
                {t("hero.cta")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/education")}
              >
                {t("nav.education")}
              </Button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="hidden lg:block">
            <div className="relative w-full h-96 bg-gradient-to-br from-green-100 to-blue-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl flex items-center justify-center">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute top-10 right-10 w-32 h-32 bg-green-400 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-400 rounded-full opacity-20 blur-3xl"></div>
              </div>
              <div className="relative text-center">
                <Cloud className="w-24 h-24 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  Real-time Climate Intelligence
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
              <Cloud className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("map.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time climate hazard mapping with ICPAC data integration
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("alerts.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Early warning alerts for drought, flood, pests, and extreme weather
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("market.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time market prices and trends for key crops
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 bg-gray-900 dark:bg-slate-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">KilimoPRO</h4>
              <p className="text-gray-400 text-sm">
                AI-powered climate intelligence for African farmers
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Climate Map</a></li>
                <li><a href="#" className="hover:text-white transition">Alerts</a></li>
                <li><a href="#" className="hover:text-white transition">Market Data</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Learn</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">IGAD Husika</h4>
              <p className="text-gray-400 text-sm">
                "Smarter Early Warning, Stronger Communities"
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 KilimoPRO. All rights reserved. | Powered by ICPAC Data</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
