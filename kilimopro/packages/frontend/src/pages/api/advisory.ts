/**
 * KilimoPRO 2.0 — Advisory API
 * GET /api/advisory?country=KE&crop=maize&type=planting&language=en
 *
 * Returns agricultural advisory content (planting, harvesting, fertilizer,
 * pest control, irrigation recommendations) for IGAD countries.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { IGAD, getCurrentSeason } from '@/lib/data/constants';

interface AdvisoryItem {
  id: string;
  country: string;
  crop: string;
  type: string;
  title: string;
  content: string;
  language: string;
  season: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { country, crop, type, language, limit } = req.query;

  try {
    const lang = (language as string) || 'en';
    const countryCode = (country as string)?.toUpperCase();
    const currentSeason = getCurrentSeason();

    // Generate advisory content based on country, crop, season, and type
    const advisory = generateAdvisoryContent(countryCode, crop as string, type as string, lang, currentSeason);

    const maxLimit = parseInt((limit as string) || '20', 10);
    const limited = advisory.slice(0, maxLimit);

    return res.status(200).json({
      success: true,
      advisory: limited,
      count: limited.length,
      country: countryCode || 'all',
      season: currentSeason,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Advisory API Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch advisory content' });
  }
}

function generateAdvisoryContent(
  countryCode?: string,
  crop?: string,
  type?: string,
  language: string = 'en',
  season: string = 'long_rains',
): AdvisoryItem[] {
  const items: AdvisoryItem[] = [];
  const countries = countryCode ? [countryCode] : Object.keys(IGAD.COUNTRIES);
  const crops = crop ? [crop.toLowerCase()] : ['maize', 'beans', 'cassava', 'sorghum'];

  const isSw = language === 'sw';

  for (const cc of countries) {
    const country = IGAD.COUNTRIES[cc as keyof typeof IGAD.COUNTRIES];
    if (!country) continue;

    for (const c of crops) {
      // Planting advice
      if (!type || type === 'planting') {
        items.push({
          id: `planting-${cc}-${c}-${season}`,
          country: country.name,
          crop: c,
          type: 'planting',
          title: isSw ? `${c}: Wakati wa kupanda (${season})` : `${c}: Planting timing (${season})`,
          content: isSw
            ? `Panda ${c} mwanzoni mwa msimu wa masika. Hakikisha udongo unatosha unyevu. Tumia mbegu bora zinazopatikana kutoka KALRO au taasisi za kilimo.`
            : `Plant ${c} at the onset of the rainy season. Ensure adequate soil moisture. Use certified seeds from KALRO or agricultural institutes. Spacing: 75cm × 30cm for maize, 50cm × 10cm for beans.`,
          language,
          season,
        });
      }

      // Fertilizer advice
      if (!type || type === 'fertilizer') {
        items.push({
          id: `fertilizer-${cc}-${c}`,
          country: country.name,
          crop: c,
          type: 'fertilizer',
          title: isSw ? `${c}: Matumizi ya mbolea` : `${c}: Fertilizer application`,
          content: isSw
            ? `Tumia mbolea ya NPK 23:23:0 kiasi cha kilo 2 kwa hekta wakati wa kupanda. Baada ya wiki 4, ongeza urea kilo 1 kwa hekta.`
            : `Apply NPK 23:23:0 at 2 bags/ha at planting. Top-dress with urea (1 bag/ha) 4 weeks after emergence. Conduct soil test every 3 years for precise recommendations.`,
          language,
          season,
        });
      }

      // Pest control
      if (!type || type === 'pest_control') {
        items.push({
          id: `pest-${cc}-${c}`,
          country: country.name,
          crop: c,
          type: 'pest_control',
          title: isSw ? `${c}: Udhibiti wa wadudu` : `${c}: Pest control`,
          content: isSw
            ? `Kwa mahindi, chunguza shamba kila wiki kwa vipeperushi vya jeshi (fall armyworm). Tumia dawa ya Fall Armyworm kama Imidacloprid mapema.`
            : `For maize, scout weekly for fall armyworm. Apply control at first sign of infestation. Use push-pull technology (intercrop with desmodium) for sustainable control. For beans, watch for bean fly and aphids.`,
          language,
          season,
        });
      }

      // Harvesting
      if (!type || type === 'harvesting') {
        items.push({
          id: `harvest-${cc}-${c}`,
          country: country.name,
          crop: c,
          type: 'harvesting',
          title: isSw ? `${c}: Muda wa kuvuna` : `${c}: Harvesting timing`,
          content: isSw
            ? `Vuna ${c} majani yakiwa yamekauka na nafaka yakiwa yameiva. Kavu nafaka kwa jua kwa siku 3-5 kabla ya kuhifadhi.`
            : `Harvest ${c} when leaves dry and grains mature. Dry grains in sun for 3-5 days before storage. Use hermetic bags (PICS) to prevent weevil damage during storage.`,
          language,
          season,
        });
      }

      // Irrigation
      if (!type || type === 'irrigation') {
        items.push({
          id: `irrigation-${cc}-${c}`,
          country: country.name,
          crop: c,
          type: 'irrigation',
          title: isSw ? `${c}: Umwagiliaji` : `${c}: Irrigation`,
          content: isSw
            ? `Kwa mikoa yasiyo na mvua ya kutosha, umwagilia asubuhi mapema au jioni. Tumia umwagiliaji wa tone (drip irrigation) kuokoa maji.`
            : `In low-rainfall areas, irrigate early morning or late evening. Use drip irrigation to save water. Critical water periods: germination, flowering, and grain filling.`,
          language,
          season,
        });
      }
    }
  }

  return items;
}
