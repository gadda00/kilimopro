/**
 * KilimoPRO — AI Chat API
 * POST /api/chat
 *
 * Calls Z.AI GLM-4-Flash (free tier, no API key needed for basic usage)
 * Falls back to keyword-based responses if no API key configured.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const ZAI_API_KEY = process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || '';
const ZAI_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const SYSTEM_PROMPT = `You are KilimoPRO, an AI agricultural advisor for 8 IGAD countries in East Africa (Djibouti, Eritrea, Ethiopia, Kenya, Somalia, South Sudan, Sudan, Uganda).

You help smallholder farmers with:
- Planting timing and techniques
- Pest and disease control (fall armyworm, Tuta absoluta, MLN, blight)
- Fertilizer application (NPK, urea, organic)
- Weather and climate adaptation
- Market prices and selling strategies
- Irrigation and water management
- Post-harvest storage

Rules:
1. Be practical and actionable — farmers need specific instructions
2. Mention specific products available in East Africa (Rocket, Coragen, Confidor, copper oxychloride)
3. Include prices in KES when relevant
4. Support both English and Swahili — respond in the language the farmer uses
5. If unsure, say so and recommend consulting a local extension officer
6. Keep responses under 300 words
7. Use emojis sparingly for visual structure (🌱🐛🧪💧🌾)
8. Reference KEPHIS, KALRO, and FAO guidelines when relevant`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { message, language } = req.body;
  if (!message || message.length < 3) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  // If we have an API key, call the real LLM
  if (ZAI_API_KEY) {
    try {
      const response = await fetch(ZAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ZAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

      return res.status(200).json({
        success: true,
        response: aiResponse,
        model: 'glm-4-flash',
        powered: 'Z.AI GLM-4-Flash',
      });
    } catch (error) {
      console.error('LLM API failed, falling back to keyword response:', error);
      // Fall through to keyword-based response
    }
  }

  // Fallback: keyword-based response (no API key)
  const response = generateKeywordResponse(message, language || 'en');
  return res.status(200).json({
    success: true,
    response,
    model: 'keyword-fallback',
    powered: 'KilimoPRO Knowledge Base',
  });
}

function generateKeywordResponse(question: string, language: string): string {
  const q = question.toLowerCase();

  if (q.includes('plant') || q.includes('panda') || q.includes('when') || q.includes('season')) {
    if (q.includes('maize') || q.includes('mahindi')) {
      return `🌱 **Maize Planting Guide (IGAD Region)**\n\n**Best planting time:**\n• Long rains: Mid-March to mid-April\n• Short rains: Mid-October to mid-November\n\n**Steps:**\n1. Prepare land 2-3 weeks before rains\n2. Use certified hybrid seeds (H614, H6213, WH505)\n3. Spacing: 75cm between rows, 30cm between plants\n4. Plant 2-3 seeds per hole, thin to 1 after 2 weeks\n5. Apply DAP/NPK at planting (2 bags/ha)\n\n**Expected yield:** 4-6 tonnes/ha with good management`;
    }
    return `🌱 Plant at the onset of the rainy season. Long rains: March-May. Short rains: October-December. Use certified seeds and apply basal fertilizer at planting.`;
  }

  if (q.includes('pest') || q.includes('worm') || q.includes('armyworm') || q.includes('disease') || q.includes('ugonjwa')) {
    return `🐛 **Fall Armyworm Control**\n\n• Scout fields every 3 days during vegetative stage\n• Look for "window pane" damage on leaves\n• Apply biopesticide (Bt) at first sign — early morning or late evening\n• Push-pull technology: intercrop with desmodium\n• Chemical: Rocket (30ml/20L) or Match (20ml/20L) every 7 days\n• Organic: Neem oil (5ml/L) or wood ash in whorl`;
  }

  if (q.includes('fertiliz') || q.includes('mbolea') || q.includes('npk') || q.includes('urea')) {
    return `🧪 **Fertilizer Guide**\n\n**Maize:** NPK 23-23-0 (2 bags/ha) at planting → Urea (1 bag/ha) at 4 weeks\n**Beans:** TSP (1 bag/ha) at planting — no nitrogen needed\n**Tomatoes:** NPK at planting → CAN every 2 weeks\n\nConduct soil test every 3 years for precise recommendations.`;
  }

  if (q.includes('weather') || q.includes('rain') || q.includes('hali') || q.includes('mvua')) {
    return `🌦️ Check the Weather page for real-time forecasts from Open-Meteo (free!). Key alerts: frost (temp < 2°C), dry spells (>5 days no rain), heavy rain (>50mm/day).`;
  }

  if (q.includes('price') || q.includes('market') || q.includes('bei') || q.includes('soko')) {
    return `📊 Check the Market page for real-time FAOSTAT prices. Tips: sell at harvest peak → store and sell later using hermetic bags (PICS). SMS "MAIZE" to get prices on your phone!`;
  }

  if (q.includes('irrigat') || q.includes('water') || q.includes('umwagiliaji') || q.includes('maji')) {
    return `💧 **Irrigation Guide**\n\nCritical periods: germination, flowering, grain filling.\nDrip irrigation saves 50-70% water. Mulch reduces evaporation by 60%.\nWater early morning (6-9 AM) or late evening (5-7 PM).`;
  }

  if (q.includes('harvest') || q.includes('vuna') || q.includes('yield')) {
    return `🌾 **Harvesting**\n\nMaize: harvest when kernels hard (20-25% moisture).\nDry grains to 13% before storage.\nUse hermetic bags (PICS) to prevent weevils.\nPost-harvest losses: 30-40% in East Africa — proper storage reduces to 5%.`;
  }

  if (q.includes('habari') || q.includes('asante') || q.includes('tafadhali') || q.includes('nina')) {
    return `Hujambo! 🌱 Niko hapa kukusaidia maswali yote ya kilimo. Uliza kuhusu kupanda, wadudu, mbolea, hali ya hewa, au soko.`;
  }

  return `Hello! 🌱 I'm KilimoPRO, your AI agricultural advisor for 8 IGAD countries.\n\nI can help with:\n• 🌱 Planting — timing, spacing, varieties\n• 🐛 Pest control — fall armyworm, diseases\n• 🧪 Fertilizer — NPK, urea, organic\n• 🌦️ Weather — forecasts and alerts\n• 📊 Market — prices and strategies\n• 💧 Irrigation — water-saving techniques\n• 🌾 Harvesting — timing and storage\n\nWhat would you like to know?`;
}
