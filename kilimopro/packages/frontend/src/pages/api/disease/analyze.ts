import type { NextApiRequest, NextApiResponse } from 'next';
import { DISEASE_DATABASE, getAllCrops } from '@/lib/disease-database';

const PRICING = {
  free: { name: 'Free', price: 0, scansPerDay: 1, features: ['Basic pixel analysis', 'Text recommendations'] },
  farmer: { name: 'Farmer', price: 50, currency: 'KES', features: ['Gemini AI analysis', 'KEPHIS RAG', 'Treatment prices'] },
  pro: { name: 'Pro', price: 200, currency: 'KES', features: ['Video+audio', 'Voice response', 'WhatsApp'] },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.query.endpoint === 'pricing') return res.status(200).json({ success: true, pricing: PRICING });
  if (req.query.endpoint === 'database') return res.status(200).json({ success: true, diseases: DISEASE_DATABASE.map(d => ({ id: d.id, name: d.name, swahiliName: d.swahiliName, crop: d.crop, severity: d.severity, regions: d.regions })), crops: getAllCrops(), count: DISEASE_DATABASE.length });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  // The actual analysis happens client-side (pixel analysis) for free tier
  // Gemini analysis would happen here for paid tiers
  return res.status(200).json({ success: true, message: 'Use client-side analysis for free tier', pricing: PRICING });
}
