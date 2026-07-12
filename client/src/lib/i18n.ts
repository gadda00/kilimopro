// Simple i18n implementation for KilimoPRO
export type Language = "en" | "sw";

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.map": "Climate Map",
    "nav.alerts": "Alerts",
    "nav.market": "Market",
    "nav.disease": "Disease Detection",
    "nav.education": "Learn",
    "nav.profile": "Profile",
    "nav.chat": "Ask KilimoPRO",

    // Hero Section
    "hero.title": "KilimoPRO",
    "hero.subtitle": "Smarter Early Warning, Stronger Communities",
    "hero.description": "AI-powered climate intelligence for smallholder farmers across the IGAD region",
    "hero.cta": "Get Started",
    "hero.mission": "Empowering farmers with real-time climate data, AI-driven insights, and market intelligence",

    // Climate Map
    "map.title": "Climate & Hazard Map",
    "map.drought": "Drought Hazard Index",
    "map.flood": "Flood Inundation",
    "map.aridity": "Aridity Index",
    "map.legend": "Legend",
    "map.search": "Search location",

    // Alerts
    "alerts.title": "Early Warning Alerts",
    "alerts.drought": "Drought Alert",
    "alerts.flood": "Flood Alert",
    "alerts.pest": "Pest Alert",
    "alerts.rainfall": "Rainfall Alert",
    "alerts.critical": "Critical",
    "alerts.high": "High",
    "alerts.medium": "Medium",
    "alerts.low": "Low",

    // Market
    "market.title": "Market Intelligence",
    "market.prices": "Real-time Prices",
    "market.trends": "Price Trends",
    "market.forecast": "Price Forecast",
    "market.crop": "Crop",
    "market.market": "Market",
    "market.price": "Price",

    // Disease Detection
    "disease.title": "Crop Disease Detection",
    "disease.upload": "Upload Photo",
    "disease.analyze": "Analyze",
    "disease.result": "Disease Detected",
    "disease.treatment": "Treatment Recommendation",
    "disease.confidence": "Confidence",

    // Ask KilimoPRO
    "chat.title": "Ask KilimoPRO",
    "chat.placeholder": "Ask about your farm, weather, crops, or market...",
    "chat.send": "Send",
    "chat.typing": "KilimoPRO is thinking...",

    // Education
    "education.title": "Learning Hub",
    "education.articles": "Articles",
    "education.videos": "Videos",
    "education.calendar": "Seasonal Calendar",
    "education.guides": "Guides",

    // Profile
    "profile.title": "My Profile",
    "profile.farm": "My Farm",
    "profile.language": "Language",
    "profile.phone": "Phone Number",
    "profile.sms": "SMS/USSD Accessible",
    "profile.location": "Farm Location",
    "profile.crop": "Primary Crop",
    "profile.soil": "Soil Type",
    "profile.area": "Farm Area (hectares)",
    "profile.edit": "Edit Profile",
    "profile.save": "Save Changes",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.back": "Back",
  },
  sw: {
    // Navigation
    "nav.home": "Nyumbani",
    "nav.map": "Ramani ya Tabia",
    "nav.alerts": "Onyo",
    "nav.market": "Soko",
    "nav.disease": "Ugonjwa wa Mazao",
    "nav.education": "Jifunze",
    "nav.profile": "Profaili",
    "nav.chat": "Uliza KilimoPRO",

    // Hero Section
    "hero.title": "KilimoPRO",
    "hero.subtitle": "Onyo Akili, Jamii Imara",
    "hero.description": "Akili ya tabia iliyotumiwa kwa wakulima wadogo katika kanda ya IGAD",
    "hero.cta": "Anza",
    "hero.mission": "Kuweza wakulima kwa data ya tabia halisi, maarifa yanayotumia AI, na habari za soko",

    // Climate Map
    "map.title": "Ramani ya Tabia na Hatari",
    "map.drought": "Faharasa ya Hatari ya Ukame",
    "map.flood": "Mafuriko ya Maji",
    "map.aridity": "Faharasa ya Ukame",
    "map.legend": "Maelezo",
    "map.search": "Tafuta mahali",

    // Alerts
    "alerts.title": "Onyo za Haraka",
    "alerts.drought": "Onyo ya Ukame",
    "alerts.flood": "Onyo ya Mafuriko",
    "alerts.pest": "Onyo ya Wadudu",
    "alerts.rainfall": "Onyo ya Mvua",
    "alerts.critical": "Hatari Sana",
    "alerts.high": "Hatari Kubwa",
    "alerts.medium": "Hatari Kawaida",
    "alerts.low": "Hatari Ndogo",

    // Market
    "market.title": "Habari za Soko",
    "market.prices": "Bei za Sasa",
    "market.trends": "Mwelekeo wa Bei",
    "market.forecast": "Utabiri wa Bei",
    "market.crop": "Mazao",
    "market.market": "Soko",
    "market.price": "Bei",

    // Disease Detection
    "disease.title": "Kugundua Ugonjwa wa Mazao",
    "disease.upload": "Pakia Picha",
    "disease.analyze": "Changanua",
    "disease.result": "Ugonjwa Umegundulika",
    "disease.treatment": "Mapendekezo ya Matibabu",
    "disease.confidence": "Uhakika",

    // Ask KilimoPRO
    "chat.title": "Uliza KilimoPRO",
    "chat.placeholder": "Uliza kuhusu shambani lako, tabia, mazao, au soko...",
    "chat.send": "Tuma",
    "chat.typing": "KilimoPRO inafikiria...",

    // Education
    "education.title": "Kituo cha Kujifunza",
    "education.articles": "Makala",
    "education.videos": "Video",
    "education.calendar": "Kalenda ya Msimu",
    "education.guides": "Mwongozo",

    // Profile
    "profile.title": "Profaili Yangu",
    "profile.farm": "Shambani Langu",
    "profile.language": "Lugha",
    "profile.phone": "Nambari ya Simu",
    "profile.sms": "Inaweza Kufikia SMS/USSD",
    "profile.location": "Mahali pa Shambani",
    "profile.crop": "Mazao Makuu",
    "profile.soil": "Aina ya Udongo",
    "profile.area": "Eneo la Shambani (hektari)",
    "profile.edit": "Hariri Profaili",
    "profile.save": "Hifadhi Mabadiliko",

    // Common
    "common.loading": "Inapakia...",
    "common.error": "Kosa",
    "common.success": "Imefanikiwa",
    "common.cancel": "Ghairi",
    "common.save": "Hifadhi",
    "common.delete": "Futa",
    "common.edit": "Hariri",
    "common.close": "Funga",
    "common.back": "Rudi",
  },
};

export function t(key: string, language: Language = "en"): string {
  return translations[language]?.[key] || key;
}
