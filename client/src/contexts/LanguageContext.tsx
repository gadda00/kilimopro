import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('kilimopro_language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('kilimopro_language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string) => {
    const translations: Record<Language, Record<string, string>> = {
      en: {
        "nav.home": "Home",
        "nav.map": "Climate Map",
        "nav.alerts": "Alerts",
        "nav.market": "Market",
        "nav.disease": "Disease Detection",
        "nav.education": "Learn",
        "nav.profile": "Profile",
        "nav.chat": "Ask KilimoPRO",
        "hero.title": "KilimoPRO",
        "hero.subtitle": "Smarter Early Warning, Stronger Communities",
        "hero.description": "AI-powered climate intelligence for smallholder farmers across the IGAD region",
        "hero.cta": "Get Started",
        "hero.mission": "Empowering farmers with real-time climate data, AI-driven insights, and market intelligence",
        "map.title": "Climate & Hazard Map",
        "map.drought": "Drought Hazard Index",
        "map.flood": "Flood Inundation",
        "map.aridity": "Aridity Index",
        "map.legend": "Legend",
        "alerts.title": "Early Warning Alerts",
        "market.title": "Market Intelligence",
        "disease.title": "Crop Disease Detection",
        "chat.title": "Ask KilimoPRO",
        "education.title": "Learning Hub",
        "profile.title": "My Profile",
        "common.loading": "Loading...",
        "common.error": "Error",
        "common.success": "Success",
      },
      sw: {
        "nav.home": "Nyumbani",
        "nav.map": "Ramani ya Tabia",
        "nav.alerts": "Onyo",
        "nav.market": "Soko",
        "nav.disease": "Ugonjwa wa Mazao",
        "nav.education": "Jifunze",
        "nav.profile": "Profaili",
        "nav.chat": "Uliza KilimoPRO",
        "hero.title": "KilimoPRO",
        "hero.subtitle": "Onyo Akili, Jamii Imara",
        "hero.description": "Akili ya tabia iliyotumiwa kwa wakulima wadogo katika kanda ya IGAD",
        "hero.cta": "Anza",
        "hero.mission": "Kuweza wakulima kwa data ya tabia halisi, maarifa yanayotumia AI, na habari za soko",
        "map.title": "Ramani ya Tabia na Hatari",
        "map.drought": "Faharasa ya Hatari ya Ukame",
        "map.flood": "Mafuriko ya Maji",
        "map.aridity": "Faharasa ya Ukame",
        "map.legend": "Maelezo",
        "alerts.title": "Onyo za Haraka",
        "market.title": "Habari za Soko",
        "disease.title": "Kugundua Ugonjwa wa Mazao",
        "chat.title": "Uliza KilimoPRO",
        "education.title": "Kituo cha Kujifunza",
        "profile.title": "Profaili Yangu",
        "common.loading": "Inapakia...",
        "common.error": "Kosa",
        "common.success": "Imefanikiwa",
      },
    };
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
