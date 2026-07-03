/**
 * Analytics Routes
 * Provides farm analytics and insights
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getDatabaseClient } from '@kilimopro/db-client';
import { getCacheClient } from '@kilimopro/cache-client';
import { createSuccessResponse, createErrorResponse, ErrorType } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('farm-service:analytics');
const db = getDatabaseClient('farm-service');
const cache = getCacheClient('farm-service');

// Schemas
const FarmAnalyticsSchema = z.object({
  farmId: z.string(),
  totalPlots: z.number(),
  totalAreaHectares: z.number(),
  activePlots: z.number(),
  emptyPlots: z.number(),
  cropDistribution: z.record(z.number()),
  statusDistribution: z.record(z.number()),
  recentActivity: z.array(z.object({
    type: z.string(),
    count: z.number(),
    date: z.string().datetime(),
  })),
  yieldEstimates: z.object({
    total: z.number().optional(),
    byCrop: z.record(z.number()).optional(),
  }).optional(),
  recommendations: z.array(z.string()),
});

const PlotAnalyticsSchema = z.object({
  plotId: z.string(),
  name: z.string(),
  sizeHectares: z.number(),
  cropType: z.string().optional(),
  variety: z.string().optional(),
  plantingDate: z.string().datetime().optional(),
  expectedHarvestDate: z.string().datetime().optional(),
  daysSincePlanting: z.number().optional(),
  daysUntilHarvest: z.number().optional(),
  status: z.string(),
  observationCount: z.number(),
  lastObservation: z.string().datetime().optional(),
  issuesDetected: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get farm analytics
  fastify.get('/:farmId/analytics', {
    schema: {
      params: z.object({
        farmId: z.string(),
      }),
      querystring: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                analytics: FarmAnalyticsSchema,
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
        401: {
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
      const { farmId } = request.params as { farmId: string };
      const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };
      const user = (request as any).user;
      
      if (!user) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.UNAUTHORIZED,
          message: 'Authentication required',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(401).send(errorResponse);
      }

      // Generate cache key
      const cacheKey = `farm:${farmId}:analytics:${startDate}:${endDate}`;
      
      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for farm analytics', { cacheKey });
        return JSON.parse(cached);
      }

      try {
        // Check if farm exists and user owns it
        const farm = await db.prisma.farm.findUnique({ where: { id: farmId } });
        
        if (!farm) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Farm not found',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        if (farm.userId !== user.id && user.role !== 'admin') {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.FORBIDDEN,
            message: 'You can only access analytics for your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        // Get all plots for this farm
        const plots = await db.prisma.plot.findMany({ where: { farmId } });
        
        // Get all observations for these plots
        const observations = await db.prisma.observation.findMany({
          where: {
            plotId: { in: plots.map(p => p.id) },
            ...(startDate || endDate ? {
              createdAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            } : {}),
          },
        });

        // Calculate analytics
        const totalPlots = plots.length;
        const totalAreaHectares = plots.reduce((sum, plot) => sum + (plot.sizeHectares || 0), 0);
        const activePlots = plots.filter(p => p.status !== 'EMPTY' && p.status !== 'FALLOW').length;
        const emptyPlots = plots.filter(p => p.status === 'EMPTY').length;
        
        // Crop distribution
        const cropDistribution: Record<string, number> = {};
        plots.forEach(plot => {
          if (plot.cropType) {
            cropDistribution[plot.cropType] = (cropDistribution[plot.cropType] || 0) + 1;
          }
        });
        
        // Status distribution
        const statusDistribution: Record<string, number> = {};
        plots.forEach(plot => {
          statusDistribution[plot.status] = (statusDistribution[plot.status] || 0) + 1;
        });

        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentObservations = observations.filter(obs => new Date(obs.createdAt) >= thirtyDaysAgo);
        
        const recentActivityByDate: Record<string, { type: string; count: number }[]> = {};
        recentObservations.forEach(obs => {
          const date = new Date(obs.createdAt).toISOString().split('T')[0];
          if (!recentActivityByDate[date]) {
            recentActivityByDate[date] = [];
          }
          const existing = recentActivityByDate[date].find(a => a.type === obs.type);
          if (existing) {
            existing.count++;
          } else {
            recentActivityByDate[date].push({ type: obs.type, count: 1 });
          }
        });

        const recentActivity = Object.entries(recentActivityByDate)
          .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
          .slice(0, 7) // Last 7 days
          .flatMap(([date, activities]) => 
            activities.map(activity => ({
              type: activity.type,
              count: activity.count,
              date,
            }))
          );

        // Issues detected
        const issues = [...new Set(observations.map(obs => obs.type))];
        
        // Generate recommendations
        const recommendations = generateFarmRecommendations(plots, observations, issues);

        const analytics: z.infer<typeof FarmAnalyticsSchema> = {
          farmId,
          totalPlots,
          totalAreaHectares,
          activePlots,
          emptyPlots,
          cropDistribution,
          statusDistribution,
          recentActivity,
          yieldEstimates: calculateYieldEstimates(plots),
          recommendations,
        };

        const response = createSuccessResponse({
          data: { analytics },
          requestId: request.id,
          meta: {
            processingTime: Date.now() - startTime,
          },
        });

        // Cache the response
        await cache.set(cacheKey, JSON.stringify(response), config.cache.ttl.analytics);
        
        return response;
      } catch (error) {
        logger.error('Failed to get farm analytics', {
          error: error as Error,
          farmId,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to calculate farm analytics',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });

  // Get plot analytics
  fastify.get('/:farmId/plots/:plotId/analytics', {
    schema: {
      params: z.object({
        farmId: z.string(),
        plotId: z.string(),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                analytics: PlotAnalyticsSchema,
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
        401: {
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
      const { farmId, plotId } = request.params as { farmId: string; plotId: string };
      const user = (request as any).user;
      
      if (!user) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.UNAUTHORIZED,
          message: 'Authentication required',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(401).send(errorResponse);
      }

      try {
        // Check if plot exists and user owns the farm
        const plot = await db.prisma.plot.findUnique({ where: { id: plotId } });
        
        if (!plot) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.NOT_FOUND,
            message: 'Plot not found',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(404).send(errorResponse);
        }

        const farm = await db.prisma.farm.findUnique({ where: { id: plot.farmId } });
        if (!farm || (farm.userId !== user.id && user.role !== 'admin')) {
          const errorResponse = createErrorResponse({
            errorType: ErrorType.FORBIDDEN,
            message: 'You can only access analytics for plots in your own farms',
            requestId: request.id,
            timestamp: new Date().toISOString(),
          });
          return reply.status(403).send(errorResponse);
        }

        // Get observations for this plot
        const observations = await db.prisma.observation.findMany({ where: { plotId } });
        
        // Calculate days since planting and until harvest
        let daysSincePlanting: number | undefined;
        let daysUntilHarvest: number | undefined;
        
        if (plot.plantingDate) {
          daysSincePlanting = Math.floor((Date.now() - new Date(plot.plantingDate).getTime()) / (1000 * 60 * 60 * 24));
        }
        
        if (plot.expectedHarvestDate) {
          daysUntilHarvest = Math.floor((new Date(plot.expectedHarvestDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        }

        // Issues detected
        const issues = [...new Set(observations.map(obs => obs.type))];
        
        // Generate recommendations
        const recommendations = generatePlotRecommendations(plot, observations, issues);

        const analytics: z.infer<typeof PlotAnalyticsSchema> = {
          plotId: plot.id,
          name: plot.name,
          sizeHectares: plot.sizeHectares,
          cropType: plot.cropType || undefined,
          variety: plot.variety || undefined,
          plantingDate: plot.plantingDate?.toISOString() || undefined,
          expectedHarvestDate: plot.expectedHarvestDate?.toISOString() || undefined,
          daysSincePlanting,
          daysUntilHarvest,
          status: plot.status,
          observationCount: observations.length,
          lastObservation: observations.length > 0 ? 
            new Date(Math.max(...observations.map(o => new Date(o.createdAt).getTime()))).toISOString() 
            : undefined,
          issuesDetected: issues,
          recommendations,
        };

        return createSuccessResponse({
          data: { analytics },
          requestId: request.id,
        });
      } catch (error) {
        logger.error('Failed to get plot analytics', {
          error: error as Error,
          plotId,
          farmId,
          userId: user.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to calculate plot analytics',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });
};

// Generate farm-level recommendations
function generateFarmRecommendations(
  plots: any[],
  observations: any[],
  issues: string[]
): string[] {
  const recommendations: string[] = [];
  
  // Check for empty plots
  const emptyPlots = plots.filter(p => p.status === 'EMPTY');
  if (emptyPlots.length > 0) {
    recommendations.push(`Consider planting ${emptyPlots.length} empty plot(s) to maximize land utilization`);
  }
  
  // Check for plots ready for harvest
  const readyForHarvest = plots.filter(p => {
    if (!p.expectedHarvestDate) return false;
    const daysUntilHarvest = Math.floor((new Date(p.expectedHarvestDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilHarvest <= 7 && daysUntilHarvest >= 0;
  });
  
  if (readyForHarvest.length > 0) {
    recommendations.push(`Prepare for harvest: ${readyForHarvest.length} plot(s) are ready or will be ready within 7 days`);
  }
  
  // Check for pest/disease issues
  if (issues.includes('pest') || issues.includes('disease')) {
    recommendations.push('Monitor fields closely for pest and disease outbreaks. Consider preventive measures.');
  }
  
  // Check for water issues
  if (issues.includes('water')) {
    recommendations.push('Review irrigation practices. Ensure adequate water supply for all crops.');
  }
  
  // Check for soil issues
  if (issues.includes('soil')) {
    recommendations.push('Consider soil testing to identify nutrient deficiencies or pH imbalances.');
  }
  
  // Check for crop diversity
  const uniqueCrops = new Set(plots.filter(p => p.cropType).map(p => p.cropType));
  if (uniqueCrops.size <= 1 && plots.length > 1) {
    recommendations.push('Consider diversifying crops to reduce risk and improve soil health.');
  }
  
  // Check for fallow plots
  const fallowPlots = plots.filter(p => p.status === 'FALLOW');
  if (fallowPlots.length > 0) {
    recommendations.push(`Consider planting cover crops in ${fallowPlots.length} fallow plot(s) to improve soil fertility`);
  }
  
  return recommendations;
}

// Generate plot-level recommendations
function generatePlotRecommendations(
  plot: any,
  observations: any[],
  issues: string[]
): string[] {
  const recommendations: string[] = [];
  
  // Check planting date
  if (!plot.plantingDate && plot.status === 'EMPTY') {
    recommendations.push('Consider planting this plot to maximize productivity');
  }
  
  // Check if planting is overdue
  if (plot.plantingDate && plot.expectedHarvestDate) {
    const daysSincePlanting = Math.floor((Date.now() - new Date(plot.plantingDate).getTime()) / (1000 * 60 * 60 * 24));
    const expectedGrowingSeason = Math.floor((new Date(plot.expectedHarvestDate).getTime() - new Date(plot.plantingDate).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSincePlanting > expectedGrowingSeason + 14) {
      recommendations.push('This crop appears to be overdue for harvest. Check crop condition and harvest if ready.');
    }
  }
  
  // Check for issues
  if (issues.includes('pest')) {
    recommendations.push('Monitor for pest damage. Apply appropriate pest control measures if needed.');
  }
  
  if (issues.includes('disease')) {
    recommendations.push('Inspect plants for disease symptoms. Remove and destroy infected plants to prevent spread.');
  }
  
  if (issues.includes('weed')) {
    recommendations.push('Weeds are competing with crops. Consider weeding to reduce competition for nutrients and water.');
  }
  
  if (issues.includes('water')) {
    recommendations.push('Check soil moisture. Adjust irrigation as needed based on crop water requirements.');
  }
  
  // Check growth stage
  if (plot.plantingDate && plot.expectedHarvestDate) {
    const daysSincePlanting = Math.floor((Date.now() - new Date(plot.plantingDate).getTime()) / (1000 * 60 * 60 * 24));
    const totalGrowingSeason = Math.floor((new Date(plot.expectedHarvestDate).getTime() - new Date(plot.plantingDate).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSincePlanting < totalGrowingSeason * 0.3) {
      recommendations.push('Early growth stage: Focus on weed control and proper nutrition.');
    } else if (daysSincePlanting < totalGrowingSeason * 0.7) {
      recommendations.push('Mid growth stage: Monitor for pests and diseases. Ensure adequate water supply.');
    } else {
      recommendations.push('Late growth stage: Prepare for harvest. Monitor crop maturity.');
    }
  }
  
  return recommendations;
}

// Calculate yield estimates
function calculateYieldEstimates(plots: any[]): { total?: number; byCrop?: Record<string, number> } {
  // In a real implementation, this would use crop-specific yield data
  // and consider factors like soil quality, weather, etc.
  
  const cropYields: Record<string, number> = {
    'maize': 3.5, // tons per hectare
    'beans': 1.2,
    'tomato': 20.0,
    'potato': 15.0,
    'coffee': 0.5,
  };
  
  const byCrop: Record<string, number> = {};
  let total = 0;
  
  plots.forEach(plot => {
    if (plot.cropType && plot.sizeHectares) {
      const yieldPerHectare = cropYields[plot.cropType.toLowerCase()] || 2.0; // default
      const plotYield = yieldPerHectare * plot.sizeHectares;
      byCrop[plot.cropType] = (byCrop[plot.cropType] || 0) + plotYield;
      total += plotYield;
    }
  });
  
  return {
    total: Math.round(total * 100) / 100,
    byCrop: Object.entries(byCrop).reduce((acc, [crop, yieldValue]) => {
      acc[crop] = Math.round(yieldValue * 100) / 100;
      return acc;
    }, {} as Record<string, number>),
  };
}
