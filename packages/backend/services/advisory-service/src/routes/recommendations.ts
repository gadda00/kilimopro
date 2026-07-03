/**
 * Personalized Recommendations Routes
 * Generates personalized farming recommendations based on user profile and conditions
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { createSuccessResponse, createErrorResponse, ErrorType } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('advisory-service:recommendations');
const cache = getCacheClient('advisory-service');

// Schemas
const RecommendationRequestSchema = z.object({
  userId: z.string().optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  farm: z.object({
    sizeHectares: z.number().min(0).optional(),
    soilType: z.string().optional(),
    soilPH: z.number().min(0).max(14).optional(),
    irrigationType: z.string().optional(),
    crops: z.array(z.object({
      type: z.string(),
      variety: z.string().optional(),
      plantingDate: z.string().datetime().optional(),
      expectedHarvestDate: z.string().datetime().optional(),
    })).default([]),
  }).optional(),
  currentWeather: z.object({
    temperature: z.number().optional(),
    humidity: z.number().min(0).max(100).optional(),
    rainfall: z.number().min(0).optional(),
    forecast: z.array(z.object({
      date: z.string().datetime(),
      temperature: z.number(),
      rainfall: z.number(),
    })).optional(),
  }).optional(),
  marketPrices: z.array(z.object({
    commodity: z.string(),
    price: z.number(),
    market: z.string(),
  })).optional(),
  preferences: z.object({
    organicFarming: z.boolean().optional(),
    riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
    investmentCapacity: z.enum(['low', 'medium', 'high']).default('medium'),
  }).optional(),
});

const RecommendationSchema = z.object({
  id: z.string(),
  type: z.enum(['crop-selection', 'planting-time', 'fertilization', 'irrigation', 'pest-control', 'harvest-time', 'market-timing', 'financial']),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(100),
  actions: z.array(z.object({
    description: z.string(),
    timing: z.string().optional(),
    resources: z.array(z.string()).optional(),
    estimatedCost: z.number().optional(),
    estimatedBenefit: z.number().optional(),
  })),
  rationale: z.string(),
  dataSources: z.array(z.string()),
  relatedContent: z.array(z.string()),
  createdAt: z.string().datetime(),
});

// Sample crop data for recommendations
const cropData = {
  maize: {
    optimalTemperature: { min: 18, max: 30 },
    optimalRainfall: { min: 500, max: 1200 },
    growingSeason: 120,
    waterRequirement: 500,
    optimalPH: { min: 5.5, max: 7.5 },
  },
  beans: {
    optimalTemperature: { min: 15, max: 28 },
    optimalRainfall: { min: 400, max: 800 },
    growingSeason: 90,
    waterRequirement: 400,
    optimalPH: { min: 6.0, max: 7.5 },
  },
  coffee: {
    optimalTemperature: { min: 18, max: 24 },
    optimalRainfall: { min: 1200, max: 2000 },
    growingSeason: 365,
    waterRequirement: 800,
    optimalPH: { min: 6.0, max: 6.5 },
  },
};

export const recommendationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get personalized recommendations
  fastify.post('/', {
    schema: {
      body: RecommendationRequestSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                recommendations: { type: 'array', items: RecommendationSchema },
                summary: {
                  type: 'object',
                  properties: {
                    totalRecommendations: { type: 'number' },
                    highPriority: { type: 'number' },
                    estimatedYieldIncrease: { type: 'number' },
                    estimatedCostSavings: { type: 'number' },
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
      },
    },
    handler: async (request, reply) => {
      const startTime = Date.now();
      const { userId, location, farm, currentWeather, marketPrices, preferences } = request.body;
      
      // Generate cache key
      const cacheKey = `advisory:recommendations:${userId}:${location.lat}:${location.lon}:${JSON.stringify(farm?.crops)}`;
      
      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for recommendations', { cacheKey });
        return JSON.parse(cached);
      }

      const recommendations: z.infer<typeof RecommendationSchema>[] = [];
      
      // Generate crop selection recommendations
      if (farm?.crops && farm.crops.length > 0) {
        farm.crops.forEach(crop => {
          const cropInfo = cropData[crop.type as keyof typeof cropData];
          if (cropInfo) {
            // Check if current weather is suitable
            if (currentWeather) {
              const tempSuitable = currentWeather.temperature >= cropInfo.optimalTemperature.min && 
                                  currentWeather.temperature <= cropInfo.optimalTemperature.max;
              
              if (!tempSuitable) {
                recommendations.push({
                  id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: 'crop-selection',
                  title: `Temperature Warning for ${crop.type}`,
                  description: `Current temperature (${currentWeather.temperature}°C) is outside optimal range (${cropInfo.optimalTemperature.min}-${cropInfo.optimalTemperature.max}°C) for ${crop.type}.`,
                  priority: 'high',
                  confidence: 90,
                  actions: [
                    {
                      description: `Consider planting ${crop.type} during cooler months or use shade nets`,
                      timing: 'Before planting',
                      resources: ['Shade nets', 'Irrigation system'],
                      estimatedCost: 50000,
                    },
                  ],
                  rationale: `Temperature affects crop growth rate and yield. ${crop.type} performs best in the specified range.`,
                  dataSources: ['KALRO Crop Guidelines', 'FAO Agricultural Data'],
                  relatedContent: ['adv-001', 'adv-004'],
                  createdAt: new Date().toISOString(),
                });
              }
            }

            // Check soil pH
            if (farm.soilPH && (farm.soilPH < cropInfo.optimalPH.min || farm.soilPH > cropInfo.optimalPH.max)) {
              recommendations.push({
                id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'fertilization',
                title: `Soil pH Adjustment for ${crop.type}`,
                description: `Your soil pH (${farm.soilPH}) is outside optimal range (${cropInfo.optimalPH.min}-${cropInfo.optimalPH.max}) for ${crop.type}.`,
                priority: 'medium',
                confidence: 85,
                actions: [
                  {
                    description: `Apply lime to increase pH or sulfur to decrease pH`,
                    timing: '2-3 months before planting',
                    resources: ['Lime', 'Sulfur', 'pH test kit'],
                    estimatedCost: 20000,
                    estimatedBenefit: 150000,
                  },
                ],
                rationale: `Optimal soil pH ensures nutrient availability for crop uptake.`,
                dataSources: ['KALRO Soil Testing Guidelines', 'FAO Soil Management'],
                relatedContent: ['adv-003'],
                createdAt: new Date().toISOString(),
              });
            }
          }
        });
      }

      // Generate planting time recommendations based on weather forecast
      if (currentWeather?.forecast && currentWeather.forecast.length > 0) {
        const next7Days = currentWeather.forecast.slice(0, 7);
        const hasRain = next7Days.some((day: any) => day.rainfall > 5);
        
        if (hasRain && farm?.crops) {
          const cropsToPlant = farm.crops.filter(crop => !crop.plantingDate);
          if (cropsToPlant.length > 0) {
            recommendations.push({
              id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'planting-time',
              title: 'Optimal Planting Window',
              description: `Rainfall is forecasted in the next 7 days. This is an optimal time to plant crops that require moisture for germination.`,
              priority: 'high',
              confidence: 80,
              actions: cropsToPlant.map(crop => ({
                description: `Plant ${crop.type} ${crop.variety || ''} now to take advantage of upcoming rainfall`,
                timing: 'Within 2-3 days',
                resources: ['Certified seeds', 'Fertilizer', 'Planting tools'],
                estimatedCost: 10000,
                estimatedBenefit: 50000,
              })),
              rationale: 'Planting before rainfall ensures good soil moisture for seed germination and early growth.',
              dataSources: ['Kenya Meteorological Department', 'KALRO Planting Calendar'],
              relatedContent: ['adv-001'],
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      // Generate market timing recommendations
      if (marketPrices && marketPrices.length > 0 && farm?.crops) {
        farm.crops.forEach(crop => {
          if (crop.expectedHarvestDate) {
            const cropMarketPrices = marketPrices.filter(p => p.commodity.toLowerCase() === crop.type.toLowerCase());
            if (cropMarketPrices.length > 0) {
              const avgPrice = cropMarketPrices.reduce((sum, p) => sum + p.price, 0) / cropMarketPrices.length;
              
              // Simple trend analysis
              if (cropMarketPrices.length >= 2) {
                const priceTrend = cropMarketPrices[0].price - cropMarketPrices[cropMarketPrices.length - 1].price;
                const trendPercentage = (priceTrend / cropMarketPrices[cropMarketPrices.length - 1].price) * 100;
                
                if (trendPercentage > 10) {
                  recommendations.push({
                    id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'market-timing',
                    title: `Sell ${crop.type} Soon - Prices Rising`,
                    description: `Market prices for ${crop.type} have increased by ${trendPercentage.toFixed(1)}% recently. Consider selling soon to maximize profits.`,
                    priority: 'high',
                    confidence: 75,
                    actions: [
                      {
                        description: 'Harvest and sell within the next 2 weeks',
                        timing: 'Immediate',
                        resources: ['Transport', 'Storage', 'Market access'],
                        estimatedBenefit: avgPrice * (farm.sizeHectares || 1) * 50, // Estimate
                      },
                    ],
                    rationale: 'Rising prices indicate increasing demand. Selling now may yield higher profits.',
                    dataSources: ['AIRC Market Data', 'Farmer Reports'],
                    relatedContent: [],
                    createdAt: new Date().toISOString(),
                  });
                } else if (trendPercentage < -10) {
                  recommendations.push({
                    id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: 'market-timing',
                    title: `Wait to Sell ${crop.type} - Prices Falling`,
                    description: `Market prices for ${crop.type} have decreased by ${Math.abs(trendPercentage).toFixed(1)}% recently. Consider waiting for better prices.`,
                    priority: 'medium',
                    confidence: 70,
                    actions: [
                      {
                        description: 'Store harvest properly and wait for price recovery',
                        timing: 'After harvest',
                        resources: ['Proper storage', 'Market monitoring'],
                        estimatedCost: 5000,
                        estimatedBenefit: avgPrice * (farm.sizeHectares || 1) * 20,
                      },
                    ],
                    rationale: 'Falling prices suggest oversupply. Waiting may result in better returns.',
                    dataSources: ['AIRC Market Data', 'Historical Price Trends'],
                    relatedContent: [],
                    createdAt: new Date().toISOString(),
                  });
                }
              }
            }
          }
        });
      }

      // Generate financial recommendations based on preferences
      if (preferences) {
        if (preferences.investmentCapacity === 'high' && preferences.riskTolerance === 'high') {
          recommendations.push({
            id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'financial',
            title: 'High-Return Investment Opportunities',
            description: 'Based on your high investment capacity and risk tolerance, consider these high-return agricultural investments.',
            priority: 'medium',
            confidence: 80,
            actions: [
              {
                description: 'Invest in greenhouse farming for high-value crops',
                timing: 'Next planting season',
                resources: ['Greenhouse structure', 'Irrigation system', 'High-value seeds'],
                estimatedCost: 500000,
                estimatedBenefit: 2000000,
              },
              {
                description: 'Consider contract farming with agribusinesses',
                timing: 'Before planting',
                resources: ['Market research', 'Legal advice', 'Production planning'],
                estimatedBenefit: 1000000,
              },
            ],
            rationale: 'High investment capacity and risk tolerance allow for higher-return, higher-risk agricultural ventures.',
            dataSources: ['Agribusiness Market Analysis', 'Financial Institution Data'],
            relatedContent: [],
            createdAt: new Date().toISOString(),
          });
        } else if (preferences.investmentCapacity === 'low') {
          recommendations.push({
            id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'financial',
            title: 'Low-Cost Farming Improvements',
            description: 'Based on your investment capacity, focus on low-cost improvements that can increase yields.',
            priority: 'medium',
            confidence: 85,
            actions: [
              {
                description: 'Implement intercropping to maximize land use',
                timing: 'Next planting season',
                resources: ['Compatible crop seeds', 'Planting guide'],
                estimatedCost: 5000,
                estimatedBenefit: 50000,
              },
              {
                description: 'Use organic fertilizers from farm waste',
                timing: 'Ongoing',
                resources: ['Compost pit', 'Farm waste'],
                estimatedCost: 2000,
                estimatedBenefit: 20000,
              },
            ],
            rationale: 'Low-cost improvements can significantly increase yields without requiring large investments.',
            dataSources: ['KALRO Low-Cost Farming Guide', 'Farmer Success Stories'],
            relatedContent: [],
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Calculate summary
      const highPriority = recommendations.filter(r => r.priority === 'high' || r.priority === 'critical').length;
      const estimatedYieldIncrease = recommendations.reduce((sum, r) => {
        return sum + (r.actions.reduce((actionSum, action) => {
          return actionSum + (action.estimatedBenefit || 0);
        }, 0) / 10);
      }, 0);
      
      const estimatedCostSavings = recommendations.reduce((sum, r) => {
        return sum + r.actions.reduce((actionSum, action) => {
          return actionSum + (action.estimatedCost || 0);
        }, 0);
      }, 0);

      const response = createSuccessResponse({
        data: {
          recommendations,
          summary: {
            totalRecommendations: recommendations.length,
            highPriority,
            estimatedYieldIncrease,
            estimatedCostSavings,
          },
        },
        requestId: request.id,
        meta: {
          processingTime: Date.now() - startTime,
        },
      });

      // Cache the response
      await cache.set(cacheKey, JSON.stringify(response), config.cache.ttl.recommendations);
      
      return response;
    },
  });
};
