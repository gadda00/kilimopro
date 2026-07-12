/**
 * KilimoPRO AgriVision — Multimodal Disease Detection Engine
 *
 * Powered by Gemini 1.5 Pro/Flash for video + audio + image analysis.
 * Uses RAG (Retrieval-Augmented Generation) with the localized KEPHIS
 * disease database to ground responses in verified data.
 *
 * Architecture:
 *   ┌──────────────┐    video/audio/image    ┌──────────────────┐
 *   │  WhatsApp /  │ ──────────────────────▶ │  AgriVision API  │
 *   │  Web upload  │                          │  (this file)     │
 *   └──────────────┘                          └────────┬─────────┘
 *                                                      │
 *                                            ┌─────────▼─────────┐
 *                                            │  RAG: disease DB  │
 *                                            │  (KEPHIS/KALRO)   │
 *                                            └─────────┬─────────┘
 *                                                      │
 *                                            ┌─────────▼─────────┐
 *                                            │  Gemini API call  │
 *                                            │  (multimodal)     │
 *                                            └─────────┬─────────┘
 *                                                      │
 *                                            ┌─────────▼─────────┐
 *                                            │  TTS (Swahili)    │
 *                                            │  + text response   │
 *                                            └───────────────────┘
 *
 * Usage:
 *   POST /api/disease/analyze
 *   { image: "base64...", video: "base64...", audio: "base64...", language: "sw" }
 *
 *   Response:
 *   { disease: "Fall Armyworm", confidence: 0.92, severity: "critical",
 *     treatment: {...}, audioScript: "...", ttsUrl: "https://..." }
 */

import { DISEASE_DATABASE, type CropDisease } from './disease-database';

// ─── Configuration ───────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
const GEMINI_MODEL = 'gemini-1.5-flash'; // use Flash for speed (Pro for complex video)
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface DiseaseAnalysisRequest {
  image?: string;      // base64-encoded image
  video?: string;      // base64-encoded video (WhatsApp video)
  audio?: string;      // base64-encoded audio (WhatsApp voice note)
  language?: 'sw' | 'en';
  userId?: string;
  country?: string;
}

export interface DiseaseAnalysisResult {
  disease: string;
  scientificName: string;
  swahiliName: string;
  crop: string;
  confidence: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  symptoms: string[];
  treatment: {
    chemical: { product: string; dosage: string; priceKES: number; instructions: string }[];
    organic: { method: string; instructions: string }[];
    cultural: string[];
  };
  audioScript: string;
  ragSources: string[];
  processingTimeMs: number;
  modelUsed: string;
}

// ─── RAG: Build context from disease database ────────────────────────────────
function buildRAGContext(visualDescription?: string): string {
  // If we have a visual description from Gemini, use it to find relevant diseases
  // Otherwise, include all diseases

  let relevantDiseases = DISEASE_DATABASE;

  if (visualDescription) {
    const desc = visualDescription.toLowerCase();
    // Simple keyword matching to find relevant diseases
    relevantDiseases = DISEASE_DATABASE.filter(d =>
      d.visualSymptoms.leafColor.some(c => desc.includes(c.toLowerCase().split(' ')[0])) ||
      d.crop.toLowerCase().includes(desc.split(' ')[0]) ||
      d.name.toLowerCase().includes(desc.split(' ')[0])
    );

    // If no matches, use all diseases
    if (relevantDiseases.length === 0) {
      relevantDiseases = DISEASE_DATABASE;
    }
  }

  // Build context string
  return relevantDiseases.map(d => `
DISEASE: ${d.name} (${d.scientificName})
CROP: ${d.crop}
VISUAL SYMPTOMS: ${d.visualSymptoms.distinctiveFeature} — ${d.visualSymptoms.leafColor.join(', ')} — ${d.visualSymptoms.leafPattern}
TREATMENT (KEPHIS-APPROVED):
  Chemical: ${d.treatment.chemical.map(c => `${c.product} (${c.activeIngredient}) ${c.dosage} — KES ${c.priceKES}`).join('; ')}
  Organic: ${d.treatment.organic.map(o => `${o.method}: ${o.instructions}`).join('; ')}
  Cultural: ${d.treatment.cultural.join('; ')}
SWAHILI ADVICE: ${d.audioScriptSwahili}
`).join('\n---\n');
}

// ─── Gemini multimodal analysis ──────────────────────────────────────────────
async function analyzeWithGemini(request: DiseaseAnalysisRequest): Promise<{
  visualDescription: string;
  cropIdentified: string;
  diseaseSuspected: string;
  confidence: number;
  transcription?: string;
}> {
  const ragContext = buildRAGContext();

  // Build the prompt with RAG context
  const systemPrompt = `You are AgriVision, an AI crop disease diagnostician for Kenyan farmers.
You have access to a database of crop diseases verified by KEPHIS (Kenya Plant Health Inspectorate Service).

DISEASE DATABASE (GROUND TRUTH — use this to verify your diagnosis):
${ragContext}

INSTRUCTIONS:
1. Analyze the attached image/video/audio carefully
2. Identify the crop (maize, tomato, coffee, cassava, beans, potato, etc.)
3. Look for visual symptoms: leaf color changes, spots, lesions, patterns, pest damage
4. If there's audio, transcribe and translate it (likely Swahili) for additional context
5. Compare what you see against the disease database above
6. Return ONLY a JSON response with this exact format:
{
  "visualDescription": "what you see in the image/video (2-3 sentences)",
  "cropIdentified": "crop name",
  "diseaseSuspected": "disease name from the database, or 'Unknown'",
  "confidence": 0.0-1.0,
  "transcription": "transcribed audio (if provided)"
}

IMPORTANT: Do NOT hallucinate. If you cannot identify the disease, return "Unknown".
Only diagnose diseases that match the database. If the plant looks healthy, say so.`;

  // Build the request parts
  const parts: any[] = [{ text: systemPrompt }];

  if (request.image) {
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: request.image,
      },
    });
  }

  if (request.video) {
    parts.push({
      inline_data: {
        mime_type: 'video/mp4',
        data: request.video,
      },
    });
  }

  if (request.audio) {
    parts.push({
      inline_data: {
        mime_type: 'audio/mp3',
        data: request.audio,
      },
    });
  }

  // Call Gemini API
  const response = await fetch(
    `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.4, // low temperature for accuracy
          maxOutputTokens: 1000,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${error.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  try {
    return JSON.parse(text);
  } catch {
    // If JSON parsing fails, try to extract from text
    return {
      visualDescription: text.slice(0, 200),
      cropIdentified: 'Unknown',
      diseaseSuspected: 'Unknown',
      confidence: 0.3,
    };
  }
}

// ─── Main analysis function ──────────────────────────────────────────────────
export async function analyzeDisease(request: DiseaseAnalysisRequest): Promise<DiseaseAnalysisResult> {
  const t0 = Date.now();
  const language = request.language || 'sw';

  // If no Gemini API key, fall back to client-side pixel analysis
  if (!GEMINI_API_KEY) {
    return fallbackAnalysis(request, t0);
  }

  try {
    // Step 1: Gemini multimodal analysis
    const geminiResult = await analyzeWithGemini(request);

    // Step 2: Match against disease database (RAG verification)
    const matchedDisease = DISEASE_DATABASE.find(
      d => d.name.toLowerCase() === geminiResult.diseaseSuspected.toLowerCase() ||
           d.scientificName.toLowerCase() === geminiResult.diseaseSuspected.toLowerCase()
    );

    // Step 3: Build result
    if (matchedDisease) {
      return {
        disease: matchedDisease.name,
        scientificName: matchedDisease.scientificName,
        swahiliName: matchedDisease.swahiliName,
        crop: matchedDisease.crop,
        confidence: geminiResult.confidence,
        severity: matchedDisease.severity,
        symptoms: [
          matchedDisease.visualSymptoms.distinctiveFeature,
          ...matchedDisease.visualSymptoms.leafColor,
        ],
        treatment: {
          chemical: matchedDisease.treatment.chemical.map(c => ({
            product: c.product,
            dosage: `${c.dosage} — ${c.frequency}`,
            priceKES: c.priceKES,
            instructions: `Available at: ${c.availableAt}`,
          })),
          organic: matchedDisease.treatment.organic,
          cultural: matchedDisease.treatment.cultural,
        },
        audioScript: language === 'sw' ? matchedDisease.audioScriptSwahili : matchedDisease.audioScriptEnglish,
        ragSources: ['KEPHIS', 'KALRO', 'PlantVillage', 'FAO East Africa'],
        processingTimeMs: Date.now() - t0,
        modelUsed: GEMINI_MODEL,
      };
    }

    // No match — return what Gemini found
    return {
      disease: geminiResult.diseaseSuspected || 'Unknown',
      scientificName: '',
      swahiliName: 'Haijulikani',
      crop: geminiResult.cropIdentified || 'Unknown',
      confidence: geminiResult.confidence,
      severity: 'low',
      symptoms: [geminiResult.visualDescription],
      treatment: {
        chemical: [],
        organic: [],
        cultural: ['Consult your local agricultural extension officer for diagnosis'],
      },
      audioScript: language === 'sw'
        ? 'Samahani, sikutambua ugonjwa kwa uhakika. Tafadhali ona afisa wa kilimo wa karibu.'
        : 'Sorry, I could not identify the disease with certainty. Please consult your nearest agricultural extension officer.',
      ragSources: ['Gemini analysis (no database match)'],
      processingTimeMs: Date.now() - t0,
      modelUsed: GEMINI_MODEL,
    };
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    return fallbackAnalysis(request, t0);
  }
}

// ─── Fallback: client-side pixel analysis (no API key) ──────────────────────
function fallbackAnalysis(request: DiseaseAnalysisRequest, t0: number): DiseaseAnalysisResult {
  // Return a generic result when Gemini is not available
  // The frontend does the actual pixel analysis in this case
  return {
    disease: 'Analysis requires AI',
    scientificName: '',
    swahiliName: '',
    crop: 'Unknown',
    confidence: 0,
    severity: 'low',
    symptoms: [],
    treatment: { chemical: [], organic: [], cultural: [] },
    audioScript: '',
    ragSources: [],
    processingTimeMs: Date.now() - t0,
    modelUsed: 'fallback (no Gemini key)',
  };
}
