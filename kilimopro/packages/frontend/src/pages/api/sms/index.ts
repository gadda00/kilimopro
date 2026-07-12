/**
 * KilimoPRO 2.0 — SMS Webhook API
 * POST /api/sms
 *
 * Handles inbound SMS from Africa's Talking or Twilio.
 * Supports keyword-based queries:
 *   MAIZE  — get maize prices
 *   WEATHER — get weather forecast
 *   ALERTS — get active climate alerts
 *   ADVISORY — get planting advice
 *   HELP   — list commands
 *
 * Works with feature phones (no smartphone required).
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { DataAggregator } from '@/lib/data/aggregator';
import { IGAD, getCountryCoordinates } from '@/lib/data/constants';

interface SmsRequest {
  from?: string;      // phone number
  text?: string;      // message text
  to?: string;        // shortcode
  id?: string;        // message ID
  date?: string;      // timestamp
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body as SmsRequest;
    const from = body.from || '';
    const text = (body.text || '').trim().toUpperCase();

    if (!text) {
      return res.status(200).json({
        success: true,
        response: 'KilimoPRO: Tuma neno kama MAIZE, WEATHER, ALERTS, au HELP. (Send a keyword like MAIZE, WEATHER, ALERTS, or HELP.)',
      });
    }

    // Parse keyword
    const [keyword, ...args] = text.split(/\s+/);
    let response = '';

    switch (keyword) {
      case 'MAIZE':
      case 'MAHINDI':
        response = await handlePriceQuery('maize', args[0]);
        break;

      case 'BEANS':
      case 'MAHARAGE':
        response = await handlePriceQuery('beans', args[0]);
        break;

      case 'PRICES':
        response = await handlePriceQuery(args[0] || 'maize', args[1]);
        break;

      case 'WEATHER':
      case 'HALI':
        response = await handleWeatherQuery(args[0]);
        break;

      case 'ALERTS':
      case 'ONYO':
        response = await handleAlertsQuery(args[0]);
        break;

      case 'ADVISORY':
      case 'USHauri':
        response = await handleAdvisoryQuery(args[0] || 'maize');
        break;

      case 'HELP':
      case 'MSAADA':
        response = 'KilimoPRO Commands:\n' +
          'MAIZE - bei ya mahindi\n' +
          'BEANS - bei ya maharage\n' +
          'WEATHER [country] - hali ya hewa\n' +
          'ALERTS [country] - onyo za hali ya hewa\n' +
          'ADVISORY [crop] - ushauri wa kilimo\n' +
          'HELP - msaada\n' +
          '— KilimoPRO';
        break;

      case 'STOP':
        response = 'Umekomesha ujumbe. Utaendelea kupokea maonyo muhimu tu.';
        break;

      default:
        response = `Samahani, neno "${keyword}" halijulikani. Tuma HELP kuona orodha ya amri.\n— KilimoPRO`;
    }

    // Log the SMS (in production, save to smsLogs table)
    console.log('SMS processed', { from, keyword, responseLength: response.length });

    return res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('SMS API Error:', error);
    return res.status(200).json({
      success: false,
      response: 'Samahani, hitilafu imetokea. Tafadhali jaribu tena. (Sorry, an error occurred.)',
    });
  }
}

async function handlePriceQuery(crop: string, countryCode?: string): Promise<string> {
  try {
    const cc = countryCode?.toUpperCase() || 'KE';
    const prices = await DataAggregator.getMarketPrices(cc, crop);

    if (!prices || prices.length === 0) {
      return `Hakuna data ya bei ya ${crop} kwa sasa. (No price data for ${crop}.)\n— KilimoPRO`;
    }

    // Format for SMS (max 160 chars per segment, but we'll use 3 segments)
    const top3 = prices.slice(0, 3);
    const lines = top3.map(p =>
      `${p.crop}: ${Math.round(p.price)} ${p.currency}/${p.unit}`,
    );
    return `Bei za ${crop} (${IGAD.COUNTRIES[cc as keyof typeof IGAD.COUNTRIES]?.name || cc}):\n${lines.join('\n')}\n— KilimoPRO`;
  } catch {
    return `Samahani, bei haipatikani. (Prices unavailable.)\n— KilimoPRO`;
  }
}

async function handleWeatherQuery(countryCode?: string): Promise<string> {
  try {
    const cc = countryCode?.toUpperCase() || 'KE';
    const [lat, lon] = getCountryCoordinates(cc);
    const weather = await DataAggregator.getWeather(lat, lon, 3);

    if (!weather.forecast || weather.forecast.length === 0) {
      return `Hali ya hewa haipatikani. (Weather unavailable.)\n— KilimoPRO`;
    }

    const today = weather.forecast[0];
    return `Hali ya Hewa ${IGAD.COUNTRIES[cc as keyof typeof IGAD.COUNTRIES]?.name}:\n` +
      `Leo: ${Math.round(today.temperatureMin)}-${Math.round(today.temperatureMax)}°C\n` +
      `Mvua: ${today.rainfall}mm (${today.rainfallProbability}%)\n` +
      `Upepo: ${Math.round(today.windSpeed)} km/h\n` +
      `— KilimoPRO`;
  } catch {
    return `Hali ya hewa haipatikani. (Weather unavailable.)\n— KilimoPRO`;
  }
}

async function handleAlertsQuery(countryCode?: string): Promise<string> {
  try {
    const cc = countryCode?.toUpperCase();
    const alerts = await DataAggregator.getHazardAlerts(cc);

    if (!alerts || alerts.length === 0) {
      return `Hakuna onyo la hali ya hewa kwa sasa. (No active weather alerts.)\n— KilimoPRO`;
    }

    const top2 = alerts.slice(0, 2);
    const lines = top2.map(a =>
      `[${a.severity.toUpperCase()}] ${a.title}\n${a.advisory || ''}`,
    );
    return `Maonyo ya Hali ya Hewa:\n${lines.join('\n---\n')}\n— KilimoPRO`;
  } catch {
    return `Maonyo hayapatikani. (Alerts unavailable.)\n— KilimoPRO`;
  }
}

async function handleAdvisoryQuery(crop: string): Promise<string> {
  const season = getCurrentSeason();
  const seasonName = IGAD.SEASONS[season as keyof typeof IGAD.SEASONS]?.name || season;

  return `Ushauri wa ${crop} (${seasonName}):\n` +
    `1. Panda mwanzoni mwa msimu wa mvua\n` +
    `2. Tumia mbolea ya NPK wakati wa kupanda\n` +
    `3. Chunguza wadudu kila wiki\n` +
    `4. Vuna nafaka zikiwa zimeiva\n` +
    `— KilimoPRO`;
}
