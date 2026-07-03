/**
 * Disease Detection Routes
 * Handles crop disease detection from images
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { getMessageQueueClient } from '@kilimopro/message-queue';
import { createSuccessResponse, createErrorResponse, ErrorType } from '@kilimopro/shared-types';
import { config } from '../config/index.js';
import { getDatabaseClient } from '@kilimopro/db-client';

const logger = getLogger('disease-service:detect');
const cache = getCacheClient('disease-service');
const mq = getMessageQueueClient('disease-service');
const db = getDatabaseClient('disease-service');

// Schemas
const DetectRequestSchema = z.object({
  image: z.string().describe('Base64 encoded image or image URL'),
  cropType: z.string().optional().describe('Type of crop (e.g., maize, beans, tomato)'),
  imageUrl: z.string().url().optional().describe('URL to the image file'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  userId: z.string().optional(),
  deviceId: z.string().optional(),
});

const DetectionResultSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  cropType: z.string().optional(),
  detectedDisease: z.string(),
  confidence: z.number().min(0).max(100),
  diseaseDetails: z.object({
    name: z.string(),
    scientificName: z.string().optional(),
    description: z.string(),
    symptoms: z.array(z.string()),
    causes: z.array(z.string()),
    prevention: z.array(z.string()),
    treatment: z.array(z.string()),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
  }),
  imageUrl: z.string().optional(),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  detectedAt: z.string().datetime(),
  processedAt: z.string().datetime(),
  modelVersion: z.string(),
  modelConfidence: z.number().min(0).max(100),
});

// Sample disease database (in production, this would come from a proper database)
const diseaseDatabase: Record<string, any> = {
  'maize': {
    'fall-armyworm': {
      name: 'Fall Armyworm',
      scientificName: 'Spodoptera frugiperda',
      description: 'A destructive pest that feeds on maize leaves, stems, and ears, causing significant yield loss.',
      symptoms: [
        'Window-pane effect on leaves',
        'Ragged leaf edges',
        'Holes in leaves',
        'Presence of larvae in whorls',
        'Defoliation of plants',
      ],
      causes: [
        'Moth infestation',
        'Warm and humid conditions',
        'Poor field sanitation',
      ],
      prevention: [
        'Plant resistant varieties',
        'Rotate crops',
        'Use pheromone traps',
        'Early planting',
        'Field sanitation',
      ],
      treatment: [
        'Apply approved insecticides',
        'Manual picking of larvae',
        'Use biological control agents',
        'Integrated Pest Management (IPM)',
      ],
      severity: 'high',
    },
    'maize-leaf-rust': {
      name: 'Maize Leaf Rust',
      scientificName: 'Puccinia sorghi',
      description: 'A fungal disease that causes rust-colored pustules on maize leaves, reducing photosynthetic capacity.',
      symptoms: [
        'Small, circular, rust-colored pustules on leaves',
        'Yellowing of leaves',
        'Premature leaf drying',
        'Reduced grain filling',
      ],
      causes: [
        'Fungal spores',
        'Warm temperatures (20-30°C)',
        'High humidity',
        'Prolonged leaf wetness',
      ],
      prevention: [
        'Plant resistant varieties',
        'Crop rotation',
        'Remove volunteer maize plants',
        'Avoid overhead irrigation',
      ],
      treatment: [
        'Apply fungicides',
        'Remove and burn infected plants',
        'Improve air circulation',
      ],
      severity: 'medium',
    },
    'maize-stalk-rot': {
      name: 'Maize Stalk Rot',
      scientificName: 'Fusarium verticillioides',
      description: 'A fungal disease that causes rotting of maize stalks, leading to lodging and yield loss.',
      symptoms: [
        'Discoloration of internal stalk tissue',
        'Premature wilting',
        'Stalk lodging',
        'Reduced grain filling',
      ],
      causes: [
        'Fungal infection through wounds',
        'Stress conditions (drought, nutrient deficiency)',
        'Insect damage',
      ],
      prevention: [
        'Plant resistant varieties',
        'Avoid stalk damage',
        'Manage insect pests',
        'Proper nutrition',
      ],
      treatment: [
        'Remove and destroy infected plants',
        'Crop rotation',
        'Fungicide application',
      ],
      severity: 'high',
    },
  },
  'tomato': {
    'early-blight': {
      name: 'Early Blight',
      scientificName: 'Alternaria solani',
      description: 'A common fungal disease that affects tomato leaves, stems, and fruits, causing significant yield loss.',
      symptoms: [
        'Brown concentric rings on leaves',
        'Yellowing of leaves',
        'Leaf drop',
        'Lesions on stems and fruits',
      ],
      causes: [
        'Fungal spores in soil',
        'Warm temperatures (24-29°C)',
        'High humidity',
        'Wet foliage',
      ],
      prevention: [
        'Plant resistant varieties',
        'Crop rotation',
        'Remove and destroy infected plant debris',
        'Avoid overhead irrigation',
        'Use mulch',
      ],
      treatment: [
        'Apply fungicides',
        'Remove infected leaves',
        'Improve air circulation',
      ],
      severity: 'medium',
    },
    'late-blight': {
      name: 'Late Blight',
      scientificName: 'Phytophthora infestans',
      description: 'A devastating fungal disease that can destroy tomato crops within days under favorable conditions.',
      symptoms: [
        'Water-soaked lesions on leaves',
        'Rapid browning and wilting',
        'White fungal growth on underside of leaves',
        'Rotting of fruits',
      ],
      causes: [
        'Fungal spores',
        'Cool temperatures (10-21°C)',
        'High humidity',
        'Wet conditions',
      ],
      prevention: [
        'Plant resistant varieties',
        'Crop rotation',
        'Remove and destroy infected plants',
        'Avoid overhead irrigation',
        'Use certified disease-free seeds',
      ],
      treatment: [
        'Apply fungicides preventively',
        'Remove and destroy infected plants immediately',
        'Improve drainage',
      ],
      severity: 'critical',
    },
  },
  'beans': {
    'angular-leaf-spot': {
      name: 'Angular Leaf Spot',
      scientificName: 'Pseudomonas syringae pv. phaseolicola',
      description: 'A bacterial disease that causes angular lesions on bean leaves, reducing yield and quality.',
      symptoms: [
        'Small water-soaked spots on leaves',
        'Angular lesions with yellow halos',
        'Leaf drop',
        'Lesions on pods',
      ],
      causes: [
        'Bacterial infection',
        'Wet conditions',
        'High humidity',
        'Infected seeds',
      ],
      prevention: [
        'Plant resistant varieties',
        'Use certified disease-free seeds',
        'Crop rotation',
        'Avoid overhead irrigation',
        'Remove and destroy infected plants',
      ],
      treatment: [
        'Apply copper-based bactericides',
        'Remove infected plants',
        'Improve air circulation',
      ],
      severity: 'medium',
    },
  },
};

// Sample detection function (in production, this would use ML model)
async function detectDisease(image: string, cropType: string | undefined): Promise<z.infer<typeof DetectionResultSchema>> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo purposes, randomly select a disease based on crop type
  const crop = cropType?.toLowerCase() || 'maize';
  const diseases = diseaseDatabase[crop] || diseaseDatabase['maize'];
  const diseaseKeys = Object.keys(diseases);
  const randomDiseaseKey = diseaseKeys[Math.floor(Math.random() * diseaseKeys.length)];
  const disease = diseases[randomDiseaseKey];
  
  // Generate random confidence
  const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%
  
  return {
    id: `det-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    cropType: crop,
    detectedDisease: disease.name,
    confidence,
    diseaseDetails: disease,
    imageUrl: typeof image === 'string' && image.startsWith('http') ? image : undefined,
    location: undefined,
    detectedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    modelVersion: 'crop-disease-v1.0',
    modelConfidence: confidence,
  };
}

export const detectRoutes: FastifyPluginAsync = async (fastify) => {
  // Detect disease from image
  fastify.post('/detect', {
    schema: {
      body: DetectRequestSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                detection: DetectionResultSchema,
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      description: { type: 'string' },
                      priority: { type: 'string' },
                      timeline: { type: 'string' },
                    },
                  },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
                processingTime: { type: 'number' },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                message: { type: 'string' },
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const startTime = Date.now();
      const { image, cropType, imageUrl, latitude, longitude, userId, deviceId } = request.body;
      
      try {
        // Validate image
        if (!image && !imageUrl) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.VALIDATION_ERROR,
            message: 'Either image (base64) or imageUrl must be provided',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(400).send(errorResponse);
        }

        // Check image size if base64
        if (image && !imageUrl) {
          const imageBuffer = Buffer.from(image, 'base64');
          if (imageBuffer.length > config.ml.maxImageSize) {
            const errorResponse = createErrorResponse({
              errorType: ErrorType.VALIDATION_ERROR,
              message: `Image too large. Maximum size is ${config.ml.maxImageSize / (1024 * 1024)}MB`,
              requestId: request.id,
              timestamp: new Date().toISOString(),
            });
            return reply.status(400).send(errorResponse);
          }
        }

        // Perform detection
        const detection = await detectDisease(image || imageUrl!, cropType);
        
        // Generate recommendations based on detection
        const recommendations = generateRecommendations(detection);
        
        // Save to database (in production)
        if (userId) {
          try {
            await db.prisma.diseaseDetection.create({
              data: {
                id: detection.id,
                userId,
                imagePath: imageUrl || 'base64-image',
                detectedDisease: detection.detectedDisease,
                confidence: detection.confidence,
                cropType: detection.cropType,
                location: detection.location ? `${detection.location.latitude},${detection.location.longitude}` : undefined,
              },
            });
            
            logger.info('Disease detection saved to database', { detectionId: detection.id, userId });
          } catch (dbError) {
            logger.warn('Failed to save detection to database', { error: dbError as Error });
          }
        }

        // Publish detection event
        try {
          await mq.publish('disease.detected', {
            detectionId: detection.id,
            userId,
            cropType: detection.cropType,
            disease: detection.detectedDisease,
            confidence: detection.confidence,
            timestamp: new Date().toISOString(),
          });
          
          logger.debug('Disease detection event published', { detectionId: detection.id });
        } catch (mqError) {
          logger.warn('Failed to publish detection event', { error: mqError as Error });
        }

        const response = createSuccessResponse({
          data: {
            detection,
            recommendations,
          },
          requestId: request.id,
          meta: {
            processingTime: Date.now() - startTime,
          },
        });

        return response;
      } catch (error) {
        logger.error('Disease detection failed', {
          error: error as Error,
          userId,
          cropType,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to detect disease',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Get detection by ID
  fastify.get('/detect/:id', {
    schema: {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                detection: DetectionResultSchema,
              },
            },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                message: { type: 'string' },
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      
      try {
        // In production, this would query the database
        // For demo, return a mock detection
        const mockDetection: z.infer<typeof DetectionResultSchema> = {
          id,
          userId: 'user-123',
          cropType: 'maize',
          detectedDisease: 'Fall Armyworm',
          confidence: 85,
          diseaseDetails: diseaseDatabase['maize']['fall-armyworm'],
          imageUrl: 'https://example.com/images/detection-123.jpg',
          location: { latitude: -1.2921, longitude: 36.8219 },
          detectedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          processedAt: new Date().toISOString(),
          modelVersion: 'crop-disease-v1.0',
          modelConfidence: 85,
        };

        return createSuccessResponse({
          data: { detection: mockDetection },
          requestId: request.id,
        });
      } catch (error) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.NOT_FOUND,
          message: 'Detection not found',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(404).send(errorResponse);
      }
    },
  });
};

// Generate recommendations based on detection
function generateRecommendations(detection: z.infer<typeof DetectionResultSchema>) {
  const disease = detection.diseaseDetails;
  const recommendations = [
    {
      type: 'immediate-action',
      description: `Immediately remove and destroy severely infected plants to prevent spread of ${disease.name}`,
      priority: 'critical',
      timeline: 'Within 24 hours',
    },
    {
      type: 'preventive-measure',
      description: `Apply ${disease.prevention[0] || 'appropriate preventive measures'} to protect healthy plants`,
      priority: 'high',
      timeline: 'Within 1 week',
    },
    {
      type: 'treatment',
      description: `Use ${disease.treatment[0] || 'recommended treatment'} as per manufacturer instructions`,
      priority: 'high',
      timeline: 'Immediate',
    },
    {
      type: 'monitoring',
      description: `Monitor field regularly for new symptoms and report to agricultural extension officer`,
      priority: 'medium',
      timeline: 'Ongoing',
    },
  ];

  // Add severity-specific recommendations
  if (disease.severity === 'critical') {
    recommendations.unshift({
      type: 'emergency',
      description: `CRITICAL: ${disease.name} detected with high confidence. Contact agricultural extension officer immediately.`,
      priority: 'critical',
      timeline: 'Immediate',
    });
  }

  return recommendations;
}
