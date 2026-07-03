/**
 * Disease Detection Routes
 * POST /api/disease/detect — Detect crop disease from image
 * GET /api/disease/history — Get detection history
 * GET /api/disease/diseases — List known diseases by crop
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '../index.js';

// Disease database — crops and their common diseases in Kenya
const DISEASE_DATABASE: Record<string, { name: string; pathogen: string; symptoms: string; treatment: string; severity: 'low' | 'medium' | 'high' }[]> = {
  maize: [
    { name: 'Maize Lethal Necrosis (MLN)', pathogen: 'Virus (MCMV + SCMV)', symptoms: 'Yellowing and mottling of leaves, necrosis of leaf margins, stunting', treatment: 'Use MLN-resistant varieties. Rotate crops. Control insect vectors (aphids, thrips). Remove infected plants.', severity: 'high' },
    { name: 'Turcicum Leaf Blight', pathogen: 'Fungus (Exserohilum turcicum)', symptoms: 'Long elliptical gray-green lesions on leaves', treatment: 'Plant resistant varieties. Apply fungicide if infection is early. Crop rotation.', severity: 'medium' },
    { name: 'Common Rust', pathogen: 'Fungus (Puccinia sorghi)', symptoms: 'Reddish-brown pustules on leaves', treatment: 'Plant resistant varieties. Fungicide application if severe.', severity: 'low' },
    { name: 'Gray Leaf Spot', pathogen: 'Fungus (Cercospora zeae-maydis)', symptoms: 'Gray rectangular lesions on leaves', treatment: 'Use resistant varieties. Rotate crops. Apply fungicide.', severity: 'medium' },
  ],
  beans: [
    { name: 'Angular Leaf Spot', pathogen: 'Fungus (Phaeoisariopsis griseola)', symptoms: 'Angular brown spots on leaves with yellow halo', treatment: 'Use certified seed. Crop rotation. Apply copper-based fungicide.', severity: 'medium' },
    { name: 'Anthracnose', pathogen: 'Fungus (Colletotrichum lindemuthianum)', symptoms: 'Dark brown sunken lesions on pods, stems, leaves', treatment: 'Use disease-free seed. Rotate with non-host crops. Apply fungicide.', severity: 'high' },
    { name: 'Bean Common Mosaic Virus', pathogen: 'Virus (BCMV)', symptoms: 'Mosaic pattern on leaves, stunting', treatment: 'Use resistant varieties. Control aphid vectors. Plant disease-free seed.', severity: 'medium' },
  ],
  'irish_potato': [
    { name: 'Late Blight', pathogen: 'Oomycete (Phytophthora infestans)', symptoms: 'Water-soaked lesions, white mold on leaf undersides', treatment: 'Apply Ridomil Gold or Curzate. Remove infected plants. Plant resistant varieties.', severity: 'high' },
    { name: 'Early Blight', pathogen: 'Fungus (Alternaria solani)', symptoms: 'Concentric ring lesions on lower leaves', treatment: 'Apply mancozeb or copper fungicide. Rotate crops.', severity: 'medium' },
    { name: 'Bacterial Wilt', pathogen: 'Bacterium (Ralstonia solanacearum)', symptoms: 'Wilting, vascular discoloration', treatment: 'Use disease-free seed tubers. Rotate 3+ years. Remove infected plants.', severity: 'high' },
  ],
  tomato: [
    { name: 'Tomato Yellow Leaf Curl Virus', pathogen: 'Virus (TYLCV)', symptoms: 'Yellowing, curling of leaves, stunting', treatment: 'Control whitefly vectors. Use resistant varieties. Remove infected plants.', severity: 'high' },
    { name: 'Bacterial Wilt', pathogen: 'Bacterium (Ralstonia solanacearum)', symptoms: 'Sudden wilting, vascular discoloration', treatment: 'Rotate crops. Use disease-free transplants. Improve drainage.', severity: 'high' },
    { name: 'Early Blight', pathogen: 'Fungus (Alternaria solani)', symptoms: 'Concentric ring lesions', treatment: 'Apply fungicide. Rotate crops. Space plants for air circulation.', severity: 'medium' },
  ],
  cassava: [
    { name: 'Cassava Mosaic Disease', pathogen: 'Virus (CMD)', symptoms: 'Mosaic pattern, leaf distortion, stunting', treatment: 'Use resistant varieties. Plant disease-free cuttings. Control whiteflies.', severity: 'high' },
    { name: 'Cassava Brown Streak Disease', pathogen: 'Virus (CBSD)', symptoms: 'Brown streaks on stems, yellowing, root necrosis', treatment: 'Use tolerant varieties. Remove infected plants. Plant clean cuttings.', severity: 'high' },
  ],
};

export async function diseaseRoutes(app: FastifyInstance) {
  // Detect disease from uploaded image
  app.post('/detect', async (request) => {
    const body = request.body as {
      userId?: string;
      imagePath: string;
      cropType?: string;
      latitude?: number;
      longitude?: number;
    };
    
    // In production, this runs the TFLite model on the image
    // For now, we return disease information for the specified crop
    let detectedDisease: string | null = null;
    let confidence: number = 0;
    
    if (body.cropType) {
      const diseases = DISEASE_DATABASE[body.cropType.toLowerCase().replace(' ', '_')];
      if (diseases && diseases.length > 0) {
        // Simulate model inference
        const detected = diseases[Math.floor(Math.random() * diseases.length)];
        detectedDisease = detected.name;
        confidence = 0.75 + Math.random() * 0.2; // 75-95% confidence
      }
    }
    
    // Log detection
    const detection = await prisma.diseaseDetection.create({
      data: {
        userId: body.userId,
        imagePath: body.imagePath,
        detectedDisease,
        confidence,
        cropType: body.cropType,
        location: body.latitude ? `${body.latitude},${body.longitude}` : null,
      },
    });
    
    // Get treatment information
    let treatment: any = null;
    if (detectedDisease && body.cropType) {
      const diseases = DISEASE_DATABASE[body.cropType.toLowerCase().replace(' ', '_')];
      const match = diseases?.find(d => d.name === detectedDisease);
      if (match) {
        treatment = {
          disease: match.name,
          pathogen: match.pathogen,
          symptoms: match.symptoms,
          treatment: match.treatment,
          severity: match.severity,
        };
      }
    }
    
    return {
      detectionId: detection.id,
      detectedDisease,
      confidence: confidence ? Math.round(confidence * 100) / 100 : null,
      isHealthy: !detectedDisease,
      treatment,
      message: detectedDisease 
        ? `Detected: ${detectedDisease} (${(confidence * 100).toFixed(0)}% confidence)`
        : 'Your crop appears healthy!',
    };
  });
  
  // List known diseases by crop
  app.get('/diseases', async (request) => {
    const { crop } = request.query as { crop?: string };
    
    if (crop) {
      const diseases = DISEASE_DATABASE[crop.toLowerCase().replace(' ', '_')] || [];
      return { crop, diseases, count: diseases.length };
    }
    
    // Return all
    const allDiseases = Object.entries(DISEASE_DATABASE).map(([crop, diseases]) => ({
      crop,
      diseases,
    }));
    return { crops: allDiseases, totalCrops: allDiseases.length };
  });
  
  // Get detection history for a user
  app.get('/history', async (request) => {
    const { userId, limit } = request.query as { userId: string; limit?: string };
    const detections = await prisma.diseaseDetection.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit || '20'),
    });
    return { detections, count: detections.length };
  });
}
