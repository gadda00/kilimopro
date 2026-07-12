/**
 * KilimoPRO 2.0 — i18n Context
 * Swahili + English translations for all pages.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Language = 'en' | 'sw';

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home', 'nav.weather': 'Weather', 'nav.alerts': 'Alerts',
    'nav.market': 'Market', 'nav.climate': 'Climate', 'nav.chat': 'Ask AI',
    'nav.disease': 'Disease Scan', 'nav.education': 'Learn', 'nav.profile': 'Profile',
    'hero.title': 'KilimoPRO', 'hero.subtitle': 'AI-Powered Agricultural Intelligence for East Africa',
    'hero.cta': 'Get Started', 'hero.stats.farmers': 'Farmers Served',
    'hero.stats.alerts': 'Alerts Sent', 'hero.stats.yield': 'Yield Increase',
    'hero.stats.data': 'Data Points',
  },
  sw: {
    'nav.home': 'Nyumbani', 'nav.weather': 'Hali ya Hewa', 'nav.alerts': 'Maonyo',
    'nav.market': 'Soko', 'nav.climate': 'Tabianchi', 'nav.chat': 'Uliza AI',
    'nav.disease': 'Tambua Magonjwa', 'nav.education': 'Jifunze', 'nav.profile': 'Wasifu',
    'hero.title': 'KilimoPRO', 'hero.subtitle': 'Akili ya Kilimo Inayotumia AI kwa Afrika Mashariki',
    'hero.cta': 'Anza', 'hero.stats.farmers': 'Wakulima Waliohudumiwa',
    'hero.stats.alerts': 'Maonyo Yaliyotumwa', 'hero.stats.yield': 'Ongezeko la Mazao',
    'hero.stats.data': 'Nukta za Data',
  },
};

const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('kilimopro_lang') : null;
    if (saved === 'sw' || saved === 'en') setLangState(saved);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem('kilimopro_lang', l);
  };

  const t = (key: string) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
