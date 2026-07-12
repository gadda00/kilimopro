/**
 * KilimoPRO 2.0 — i18n Context
 * Full Swahili + English translations ported from v1.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Language = 'en' | 'sw';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home', 'nav.weather': 'Weather', 'nav.alerts': 'Alerts',
    'nav.market': 'Market', 'nav.climate': 'Climate', 'nav.chat': 'Ask AI',
    'nav.disease': 'Disease Scan', 'nav.education': 'Learn', 'nav.profile': 'Profile',

    // Hero
    'hero.title': 'KilimoPRO',
    'hero.subtitle': 'AI-Powered Agricultural Intelligence for East Africa',
    'hero.description': 'Real-time climate data, market prices, and AI advisory for 8 IGAD countries',
    'hero.cta': 'Get Started',
    'hero.stats.farmers': 'Farmers Served',
    'hero.stats.alerts': 'Alerts Sent',
    'hero.stats.yield': 'Yield Increase',
    'hero.stats.data': 'Data Points',
    'hero.mission': 'Empowering farmers with real-time climate data, AI-driven insights, and market intelligence',

    // Weather
    'weather.title': 'Weather Intelligence',
    'weather.current': 'Current Weather',
    'weather.forecast': '7-Day Forecast',
    'weather.humidity': 'Humidity',
    'weather.rainfall': 'Rainfall',
    'weather.wind': 'Wind Speed',

    // Alerts
    'alerts.title': 'Early Warning Alerts',
    'alerts.drought': 'Drought Alert', 'alerts.flood': 'Flood Alert',
    'alerts.pest': 'Pest Alert', 'alerts.rainfall': 'Rainfall Alert',
    'alerts.critical': 'Critical', 'alerts.high': 'High',
    'alerts.medium': 'Medium', 'alerts.low': 'Low',
    'alerts.none': 'No active alerts. Conditions look good!',

    // Market
    'market.title': 'Market Intelligence',
    'market.prices': 'Real-time Prices', 'market.trends': 'Price Trends',
    'market.crop': 'Crop', 'market.market': 'Market', 'market.price': 'Price',
    'market.noData': 'No price data available',

    // Disease
    'disease.title': 'Crop Disease Detection',
    'disease.upload': 'Upload Photo', 'disease.analyze': 'Analyze',
    'disease.result': 'Disease Detected', 'disease.treatment': 'Treatment Recommendation',
    'disease.confidence': 'Confidence',

    // Chat
    'chat.title': 'Ask KilimoPRO',
    'chat.placeholder': 'Ask about your farm, weather, crops, or market...',
    'chat.send': 'Send', 'chat.typing': 'KilimoPRO is thinking...',

    // Education
    'education.title': 'Learning Hub',
    'education.articles': 'Articles', 'education.videos': 'Videos',
    'education.calendar': 'Seasonal Calendar', 'education.guides': 'Guides',

    // Profile
    'profile.title': 'My Profile',
    'profile.farm': 'My Farm', 'profile.language': 'Language',
    'profile.phone': 'Phone Number', 'profile.sms': 'SMS/USSD Accessible',
    'profile.location': 'Farm Location', 'profile.crop': 'Primary Crop',
    'profile.soil': 'Soil Type', 'profile.area': 'Farm Area (hectares)',
    'profile.edit': 'Edit Profile', 'profile.save': 'Save Changes',

    // Common
    'common.loading': 'Loading...', 'common.error': 'Error',
    'common.success': 'Success', 'common.cancel': 'Cancel',
    'common.save': 'Save', 'common.delete': 'Delete',
    'common.edit': 'Edit', 'common.close': 'Close', 'common.back': 'Back',
  },
  sw: {
    // Navigation
    'nav.home': 'Nyumbani', 'nav.weather': 'Hali ya Hewa', 'nav.alerts': 'Maonyo',
    'nav.market': 'Soko', 'nav.climate': 'Tabianchi', 'nav.chat': 'Uliza AI',
    'nav.disease': 'Tambua Magonjwa', 'nav.education': 'Jifunze', 'nav.profile': 'Wasifu',

    // Hero
    'hero.title': 'KilimoPRO',
    'hero.subtitle': 'Akili ya Kilimo Inayotumia AI kwa Afrika Mashariki',
    'hero.description': 'Data ya hali ya hewa, bei za soko, na ushauri wa AI kwa nchi 8 za IGAD',
    'hero.cta': 'Anza',
    'hero.stats.farmers': 'Wakulima Waliohudumiwa',
    'hero.stats.alerts': 'Maonyo Yaliyotumwa',
    'hero.stats.yield': 'Ongezeko la Mazao',
    'hero.stats.data': 'Nukta za Data',
    'hero.mission': 'Kuwawezesha wakulima kwa data ya hali ya hewa halisi, maarifa ya AI, na habari za soko',

    // Weather
    'weather.title': 'Akili ya Hali ya Hewa',
    'weather.current': 'Hali ya Sasa',
    'weather.forecast': 'Tabiri ya Siku 7',
    'weather.humidity': 'Unyevu',
    'weather.rainfall': 'Mvua',
    'weather.wind': 'Mwendo wa Upepo',

    // Alerts
    'alerts.title': 'Maonyo ya Haraka',
    'alerts.drought': 'Onyo ya Ukame', 'alerts.flood': 'Onyo ya Mafuriko',
    'alerts.pest': 'Onyo ya Wadudu', 'alerts.rainfall': 'Onyo ya Mvua',
    'alerts.critical': 'Hatari Sana', 'alerts.high': 'Hatari Kubwa',
    'alerts.medium': 'Hatari Kawaida', 'alerts.low': 'Hatari Ndogo',
    'alerts.none': 'Hakuna onyo. Hali inaonekana nzuri!',

    // Market
    'market.title': 'Habari za Soko',
    'market.prices': 'Bei za Sasa', 'market.trends': 'Mwelekeo wa Bei',
    'market.crop': 'Mazao', 'market.market': 'Soko', 'market.price': 'Bei',
    'market.noData': 'Hakuna data ya bei',

    // Disease
    'disease.title': 'Kugundua Ugonjwa wa Mazao',
    'disease.upload': 'Pakia Picha', 'disease.analyze': 'Changanua',
    'disease.result': 'Ugonjwa Umegundulika',
    'disease.treatment': 'Mapendekezo ya Matibabu', 'disease.confidence': 'Uhakika',

    // Chat
    'chat.title': 'Uliza KilimoPRO',
    'chat.placeholder': 'Uliza kuhusu shamba lako, hali ya hewa, mazao, au soko...',
    'chat.send': 'Tuma', 'chat.typing': 'KilimoPRO inafikiria...',

    // Education
    'education.title': 'Kituo cha Kujifunza',
    'education.articles': 'Makala', 'education.videos': 'Video',
    'education.calendar': 'Kalenda ya Msimu', 'education.guides': 'Mwongozo',

    // Profile
    'profile.title': 'Wasifu Wangu',
    'profile.farm': 'Shamba Langu', 'profile.language': 'Lugha',
    'profile.phone': 'Nambari ya Simu', 'profile.sms': 'Inaweza Kufikia SMS/USSD',
    'profile.location': 'Mahali pa Shamba', 'profile.crop': 'Mazao Makuu',
    'profile.soil': 'Aina ya Udongo', 'profile.area': 'Eneo la Shamba (hektari)',
    'profile.edit': 'Hariri Wasifu', 'profile.save': 'Hifadhi Mabadiliko',

    // Common
    'common.loading': 'Inapakia...', 'common.error': 'Kosa',
    'common.success': 'Imefanikiwa', 'common.cancel': 'Ghairi',
    'common.save': 'Hifadhi', 'common.delete': 'Futa',
    'common.edit': 'Hariri', 'common.close': 'Funga', 'common.back': 'Rudi',
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

  const t = (key: string) => translations[lang][key] || translations.en[key] || key;

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
