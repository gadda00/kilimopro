/**
 * Council Mode Routes
 * Multi-agent AI deliberation for complex agricultural decisions
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { createSuccessResponse, createErrorResponse, ErrorType } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('advisory-service:council');
const cache = getCacheClient('advisory-service');

// Schemas
const CouncilRequestSchema = z.object({
  userId: z.string().optional(),
  question: z.string().min(10).max(1000),
  context: z.object({
    location: z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    }).optional(),
    farm: z.object({
      sizeHectares: z.number().min(0).optional(),
      soilType: z.string().optional(),
      crops: z.array(z.string()).optional(),
    }).optional(),
    currentWeather: z.object({
      temperature: z.number().optional(),
      rainfall: z.number().optional(),
      season: z.string().optional(),
    }).optional(),
    marketConditions: z.object({
      prices: z.record(z.number()).optional(),
      trends: z.record(z.string()).optional(),
    }).optional(),
    budget: z.number().min(0).optional(),
    goals: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
  }).optional(),
  language: z.enum(['en', 'sw']).default('en'),
  personas: z.array(z.enum(['agronomist', 'meteorologist', 'economist', 'veterinarian', 'sustainability'])).optional(),
});

const CouncilResponseSchema = z.object({
  id: z.string(),
  question: z.string(),
  answers: z.array(z.object({
    persona: z.string(),
    response: z.string(),
    confidence: z.number().min(0).max(100),
    reasoning: z.array(z.string()),
    recommendations: z.array(z.string()),
    sources: z.array(z.string()),
  })),
  consensus: z.object({
    summary: z.string(),
    confidence: z.number().min(0).max(100),
    agreementLevel: z.enum(['unanimous', 'high', 'medium', 'low', 'conflict']),
    finalRecommendation: z.string(),
    actionItems: z.array(z.object({
      description: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      timeline: z.string(),
      resources: z.array(z.string()),
    })),
  }),
  metadata: z.object({
    processingTime: z.number(),
    modelUsed: z.string(),
    tokensUsed: z.number(),
    cost: z.number(),
  }),
  createdAt: z.string().datetime(),
});

// Persona definitions
const personas = {
  agronomist: {
    name: 'Dr. Agronomist',
    role: 'Crop Management Expert',
    expertise: ['Crop selection', 'Soil health', 'Fertilization', 'Planting techniques', 'Harvest timing'],
    bio: 'PhD in Agronomy with 20+ years experience in Kenyan agriculture. Specializes in crop management, soil fertility, and sustainable farming practices.',
    avatar: '👨🌾',
  },
  meteorologist: {
    name: 'Prof. Meteorologist',
    role: 'Weather & Climate Expert',
    expertise: ['Weather forecasting', 'Climate patterns', 'Drought management', 'Seasonal planning', 'Climate change adaptation'],
    bio: 'Climate scientist with expertise in East African weather patterns. Provides accurate weather forecasts and climate risk assessments.',
    avatar: '🌦️',
  },
  economist: {
    name: 'Dr. Economist',
    role: 'Agricultural Economics Expert',
    expertise: ['Market analysis', 'Price forecasting', 'Financial planning', 'Risk management', 'Investment advice'],
    bio: 'Agricultural economist with deep knowledge of Kenyan and regional markets. Specializes in market trends, price forecasting, and financial decision-making.',
    avatar: '💰',
  },
  veterinarian: {
    name: 'Dr. Veterinarian',
    role: 'Livestock Health Expert',
    expertise: ['Livestock management', 'Disease prevention', 'Animal nutrition', 'Breeding programs', 'Vaccination schedules'],
    bio: 'Veterinary doctor with 15+ years experience in livestock health. Provides advice on animal husbandry, disease prevention, and herd management.',
    avatar: '🐄',
  },
  sustainability: {
    name: 'Prof. Sustainability',
    role: 'Sustainable Agriculture Expert',
    expertise: ['Climate resilience', 'Sustainable practices', 'Water management', 'Biodiversity', 'Carbon footprint'],
    bio: 'Sustainability expert focusing on climate-resilient agriculture. Advises on sustainable farming practices, water conservation, and environmental impact.',
    avatar: '🌱',
  },
};

// Sample responses for demonstration (in production, this would call actual LLM APIs)
const generateSampleResponse = (question: string, context: any, language: string): z.infer<typeof CouncilResponseSchema> => {
  const selectedPersonas = context.personas || ['agronomist', 'meteorologist', 'economist'];
  
  // Generate answers from each persona
  const answers = selectedPersonas.map(personaKey => {
    const persona = personas[personaKey as keyof typeof personas];
    
    // Generate persona-specific response based on question type
    let response = '';
    let reasoning: string[] = [];
    let recommendations: string[] = [];
    
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('maize') || questionLower.includes('mahindi')) {
      if (personaKey === 'agronomist') {
        response = `Based on your location and soil conditions, I recommend planting ${context.farm?.crops?.includes('maize') ? 'improved' : 'certified'} maize varieties. The optimal planting time is at the onset of the long rains. Ensure proper spacing of 75cm between rows and 25cm between plants.`;
        reasoning = [
          'Maize requires well-drained soils with pH 5.5-7.5',
          'Optimal temperature range is 18-30°C',
          'Requires 500-1200mm of rainfall per season',
          'Proper spacing ensures good air circulation and reduces disease risk',
        ];
        recommendations = [
          'Use certified seeds from KALRO',
          'Apply DAP fertilizer at planting',
          'Top-dress with CAN fertilizer 3-4 weeks after planting',
          'Monitor for pests like Fall Armyworm',
        ];
      } else if (personaKey === 'meteorologist') {
        response = `The current weather patterns indicate a normal to above-normal rainfall season. This is favorable for maize production. However, be prepared for potential dry spells in mid-season by implementing water conservation measures.`;
        reasoning = [
          'Current ENSO conditions suggest good rainfall',
          'Historical data shows similar patterns in previous years',
          'Mid-season dry spells are common in this region',
        ];
        recommendations = [
          'Plant early to take advantage of early rains',
          'Implement rainwater harvesting',
          'Consider drought-resistant varieties as backup',
        ];
      } else if (personaKey === 'economist') {
        response = `Maize prices are currently stable but expected to increase by 15-20% in the next 3-4 months due to regional demand. This presents a good opportunity for profit. However, input costs (fertilizer, seeds) have increased by 10-15% this season.`;
        reasoning = [
          'Regional demand from Uganda and Tanzania is increasing',
          'Government reserves are at historical lows',
          'Input costs are rising due to global supply chain issues',
        ];
        recommendations = [
          'Increase maize acreage by 20-30% if possible',
          'Secure inputs early to avoid further price increases',
          'Consider forward contracts with buyers',
        ];
      }
    } else if (questionLower.includes('soil') || questionLower.includes('udongo')) {
      if (personaKey === 'agronomist') {
        response = `Soil testing is essential before planting. Based on your soil type (${context.farm?.soilType || 'unknown'}), I recommend the following amendments: organic matter to improve structure, lime to adjust pH if needed, and specific fertilizers based on nutrient deficiencies.`;
        reasoning = [
          'Soil testing provides accurate nutrient levels',
          'Organic matter improves water retention and fertility',
          'pH affects nutrient availability',
        ];
        recommendations = [
          'Conduct comprehensive soil test',
          'Apply 10-20 tons of compost per hectare',
          'Use balanced NPK fertilizer based on test results',
        ];
      } else if (personaKey === 'sustainability') {
        response = `Improving soil health is key to sustainable farming. Consider cover cropping, crop rotation, and reduced tillage to build soil organic matter. These practices also help with climate resilience and reduce erosion.`;
        reasoning = [
          'Cover crops prevent erosion and add organic matter',
          'Crop rotation breaks pest and disease cycles',
          'Reduced tillage preserves soil structure',
        ];
        recommendations = [
          'Plant cover crops like legumes in off-season',
          'Rotate with nitrogen-fixing crops',
          'Practice conservation agriculture',
        ];
      }
    } else if (questionLower.includes('market') || questionLower.includes('soko')) {
      if (personaKey === 'economist') {
        response = `Current market conditions show mixed signals. While some commodities are at historical highs, others are depressed due to oversupply. Diversification is key to managing risk. Consider contracting with cooperatives for better prices.`;
        reasoning = [
          'Market volatility is high due to global factors',
          'Cooperatives provide better bargaining power',
          'Diversification reduces risk exposure',
        ];
        recommendations = [
          'Join a local cooperative',
          'Diversify into 2-3 crops',
          'Monitor market trends weekly',
        ];
      }
    }
    
    // Default response if no specific match
    if (!response) {
      response = `This is a complex question that requires careful consideration. Based on the information provided, I would recommend gathering more data before making a decision.`;
      reasoning = ['More information needed for accurate advice'];
      recommendations = ['Conduct further research', 'Consult local experts'];
    }
    
    return {
      persona: persona.name,
      response: language === 'sw' ? translateToSwahili(response) : response,
      confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
      reasoning: language === 'sw' ? reasoning.map(translateToSwahili) : reasoning,
      recommendations: language === 'sw' ? recommendations.map(translateToSwahili) : recommendations,
      sources: [
        `KALRO ${persona.role} Guidelines`,
        `FAO ${persona.role} Handbook`,
        `${persona.name}'s Expert Knowledge`,
      ],
    };
  });
  
  // Generate consensus
  const confidenceScores = answers.map(a => a.confidence);
  const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
  
  // Determine agreement level
  let agreementLevel: 'unanimous' | 'high' | 'medium' | 'low' | 'conflict' = 'medium';
  if (avgConfidence > 90) agreementLevel = 'unanimous';
  else if (avgConfidence > 80) agreementLevel = 'high';
  else if (avgConfidence > 70) agreementLevel = 'medium';
  else if (avgConfidence > 60) agreementLevel = 'low';
  else agreementLevel = 'conflict';
  
  // Generate final recommendation
  const finalRecommendation = answers.map(a => a.response).join(' ');
  
  return {
    id: `council-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    question,
    answers,
    consensus: {
      summary: `The council has reviewed your question and provides the following consensus: ${answers.length} experts have provided their perspectives with an average confidence of ${avgConfidence.toFixed(1)}%.`,
      confidence: avgConfidence,
      agreementLevel,
      finalRecommendation,
      actionItems: answers.flatMap(a => a.recommendations).map((rec, index) => ({
        description: rec,
        priority: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4) as 'critical' | 'high' | 'medium' | 'low'],
        timeline: ['Immediate', 'Within 1 week', 'Within 1 month', 'Next season'][Math.floor(Math.random() * 4)],
        resources: ['Time', 'Money', 'Equipment', 'Knowledge'][Math.floor(Math.random() * 4)],
      })),
    },
    metadata: {
      processingTime: Math.floor(Math.random() * 5000) + 2000, // 2-7 seconds
      modelUsed: 'kilimopro-council-v1',
      tokensUsed: Math.floor(Math.random() * 5000) + 1000,
      cost: parseFloat((Math.random() * 0.5).toFixed(4)),
    },
    createdAt: new Date().toISOString(),
  };
};

// Simple translation function (in production, use a proper translation API)
function translateToSwahili(text: string): string {
  const translations: Record<string, string> = {
    'maize': 'mahindi',
    'corn': 'mahindi',
    'soil': 'udongo',
    'weather': 'hali ya hewa',
    'market': 'soko',
    'price': 'bei',
    'plant': 'panda',
    'harvest': 'vuna',
    'fertilizer': 'mbole',
    'rain': 'mvua',
    'drought': 'ukame',
    'crop': 'mimea',
    'farm': 'shamba',
    'season': 'msimu',
    'recommend': 'pendekeza',
    'advice': 'ushauri',
    'expert': 'mtaalamu',
    'agronomist': 'mtaalamu wa kilimo',
    'meteorologist': 'mtaalamu wa hali ya hewa',
    'economist': 'mtaalamu wa uchumi',
    'veterinarian': 'daktari wa wanyama',
    'sustainability': 'endelevu',
  };
  
  return text.split(' ').map(word => {
    const lowerWord = word.toLowerCase();
    return translations[lowerWord] || word;
  }).join(' ');
}

export const councilRoutes: FastifyPluginAsync = async (fastify) => {
  // Get list of available personas
  fastify.get('/personas', {
    handler: async (request, reply) => {
      const personaList = Object.entries(personas).map(([key, persona]) => ({
        id: key,
        ...persona,
      }));
      
      return createSuccessResponse({
        data: { personas: personaList },
        requestId: request.id,
      });
    },
  });

  // Submit question to council
  fastify.post('/', {
    schema: {
      body: CouncilRequestSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: CouncilResponseSchema,
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string' },
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
      const { userId, question, context, language, personas: selectedPersonas } = request.body;
      
      // Generate cache key
      const cacheKey = `advisory:council:${userId}:${question.substring(0, 50)}:${JSON.stringify(context)}`;
      
      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for council response', { cacheKey });
        return JSON.parse(cached);
      }

      // Validate question
      if (question.length < 10) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.VALIDATION_ERROR,
          message: 'Question must be at least 10 characters long',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(400).send(errorResponse);
      }

      // Generate council response (in production, this would call actual LLM APIs)
      const councilResponse = generateSampleResponse(question, { ...context, personas: selectedPersonas }, language);

      const response = createSuccessResponse({
        data: councilResponse,
        requestId: request.id,
        meta: {
          processingTime: Date.now() - startTime,
        },
      });

      // Cache the response
      await cache.set(cacheKey, JSON.stringify(response), config.cache.ttl.council);
      
      logger.info('Council response generated', {
        userId,
        questionLength: question.length,
        personas: selectedPersonas || config.council.personas,
        processingTime: Date.now() - startTime,
      });

      return response;
    },
  });

  // Get council history for a user
  fastify.get('/history', {
    schema: {
      querystring: z.object({
        userId: z.string(),
        limit: z.number().min(1).max(50).default(10),
      }),
    },
    handler: async (request, reply) => {
      const { userId, limit } = request.query as { userId: string; limit: number };
      
      // In production, this would query the database
      // For now, return empty array
      return createSuccessResponse({
        data: {
          history: [],
          total: 0,
        },
        requestId: request.id,
      });
    },
  });
};

// Simple translation helper for Swahili
export function translateToSwahili(text: string): string {
  return text;
}
