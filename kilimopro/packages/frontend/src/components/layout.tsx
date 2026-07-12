/**
 * KilimoPRO 2.0 — Shared Layout
 * Navbar with navigation + language switcher + country selector.
 */

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, type ReactNode } from 'react';
import { CloudRain, AlertTriangle, TrendingUp, Globe, Brain, Camera, BookOpen, User, Menu, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { CountrySelector } from '@/components/shared/country-selector';

export function Layout({ children, country, onCountryChange }: {
  children: ReactNode;
  country: string;
  onCountryChange: (c: string) => void;
}) {
  const { t, lang, setLang } = useLang();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: t('nav.home'), icon: Globe },
    { href: '/weather', label: t('nav.weather'), icon: CloudRain },
    { href: '/alerts', label: t('nav.alerts'), icon: AlertTriangle },
    { href: '/market', label: t('nav.market'), icon: TrendingUp },
    { href: '/chat', label: t('nav.chat'), icon: Brain },
    { href: '/disease', label: t('nav.disease'), icon: Camera },
    { href: '/education', label: t('nav.education'), icon: BookOpen },
    { href: '/profile', label: t('nav.profile'), icon: User },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-kilimo-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="w-8 h-8 rounded-lg bg-white text-kilimo-600 grid place-items-center text-sm">K</span>
              Kilimo<span className="text-green-200">PRO</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                      ${active ? 'bg-white/20 text-white' : 'text-green-100 hover:bg-white/10'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
                className="px-2 py-1 rounded text-xs font-medium bg-white/10 hover:bg-white/20"
              >
                {lang === 'en' ? '🇰🇪 SW' : '🇬🇧 EN'}
              </button>
              <div className="hidden sm:block">
                <CountrySelector value={country} onChange={onCountryChange} />
              </div>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-white/10"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <nav className="lg:hidden pb-3 grid grid-cols-2 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2
                      ${active ? 'bg-white/20' : 'hover:bg-white/10'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          KilimoPRO 2.0 — AI Agricultural Intelligence for 8 IGAD Countries 🌍<br />
          <span className="text-gray-500">Data: FAOSTAT · ICPAC · Open-Meteo · World Bank (all free)</span>
        </div>
      </footer>
    </div>
  );
}
