/**
 * Disease Alert Routes
 * Manages disease outbreak alerts and notifications
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { getMessageQueueClient } from '@kilimopro/message-queue';
import { createSuccessResponse, createErrorResponse, ErrorType } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('disease-service:alerts');
const cache = getCacheClient('disease-service');
const mq = getMessageQueueClient('disease-service');

// Schemas
const AlertSchema = z.object({
  id: z.string(),
  disease: z.string(),
  crop: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  affectedAreas: z.array(z.string()),
  reportedBy: z.string(),
  reportedAt: z.string().datetime(),
  confirmed: z.boolean(),
  confirmedAt: z.string().datetime().optional(),
  status: z.enum(['active', 'resolved', 'false-alarm']),
  recommendations: z.array(z.string()),
  source: z.string(),
});

const AlertRequestSchema = z.object({
  disease: z.string(),
  crop: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  description: z.string(),
  affectedAreas: z.array(z.string()),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  userId: z.string().optional(),
  contactInfo: z.string().optional(),
});

// Sample alerts (in production, this would come from a database)
let alerts: z.infer<typeof AlertSchema>[] = [
  {
    id: 'alert-001',
    disease: 'Fall Armyworm',
    crop: 'maize',
    severity: 'high',
    description: 'Increased Fall Armyworm activity reported in Central Kenya. Farmers should monitor their fields closely.',
    affectedAreas: ['Nyeri', 'Kiambu', 'Murang\'a', 'Kirinyaga'],
    reportedBy: 'KALRO Extension Officer',
    reportedAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
    confirmed: true,
    confirmedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: 'active',
    recommendations: [
      'Monitor fields daily for Fall Armyworm symptoms',
      'Use pheromone traps for early detection',
      'Apply approved insecticides if infestation is confirmed',
      'Report sightings to local agricultural office',
    ],
    source: 'KALRO Pest Surveillance',
  },
  {
    id: 'alert-002',
    disease: 'Maize Lethal Necrosis',
    crop: 'maize',
    severity: 'critical',
    description: 'Outbreak of Maize Lethal Necrosis disease confirmed in parts of Rift Valley. Immediate action required.',
    affectedAreas: ['Nakuru', 'Uasin Gishu', 'Trans Nzoia'],
    reportedBy: 'Ministry of Agriculture',
    reportedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    confirmed: true,
    confirmedAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    status: 'active',
    recommendations: [
      'Destroy all infected plants immediately',
      'Do not use seed from infected fields',
      'Rotate with non-host crops',
      'Disinfect farm equipment',
      'Report to agricultural authorities',
    ],
    source: 'Ministry of Agriculture Disease Surveillance',
  },
];

export const alertRoutes: FastifyPluginAsync = async (fastify) => {
  // Get active alerts
  fastify.get('/', {
    schema: {
      querystring: z.object({
        crop: z.string().optional(),
        disease: z.string().optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        area: z.string().optional(),
        status: z.enum(['active', 'resolved', 'false-alarm']).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                alerts: { type: 'array', items: AlertSchema },
                total: { type: 'number' },
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
      },
    },
    handler: async (request, reply) => {
      const { crop, disease, severity, area, status, limit } = request.query as {
        crop?: string;
        disease?: string;
        severity?: string;
        area?: string;
        status?: string;
        limit?: number;
      };
      
      // Generate cache key
      const cacheKey = `disease:alerts:${crop}:${disease}:${severity}:${area}:${status}`;
      
      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for alerts', { cacheKey });
        return JSON.parse(cached);
      }

      // Filter alerts
      let filteredAlerts = [...alerts];
      
      if (crop) {
        filteredAlerts = filteredAlerts.filter(alert => 
          alert.crop.toLowerCase().includes(crop.toLowerCase())
        );
      }

      if (disease) {
        filteredAlerts = filteredAlerts.filter(alert => 
          alert.disease.toLowerCase().includes(disease.toLowerCase())
        );
      }

      if (severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
      }

      if (area) {
        filteredAlerts = filteredAlerts.filter(alert => 
          alert.affectedAreas.some(a => a.toLowerCase().includes(area.toLowerCase()))
        );
      }

      if (status) {
        filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
      }

      // Sort by severity and date
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      filteredAlerts = filteredAlerts.sort((a, b) => {
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
      });

      // Limit results
      const limitedAlerts = filteredAlerts.slice(0, limit);

      const response = createSuccessResponse({
        data: {
          alerts: limitedAlerts,
          total: filteredAlerts.length,
        },
        requestId: request.id,
      });

      // Cache the response
      await cache.set(cacheKey, JSON.stringify(response), config.cache.ttl.alerts);
      
      return response;
    },
  });

  // Get specific alert by ID
  fastify.get('/:id', {
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
                alert: AlertSchema,
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
      
      const alert = alerts.find(a => a.id === id);
      
      if (!alert) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.NOT_FOUND,
          message: 'Alert not found',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(404).send(errorResponse);
      }

      return createSuccessResponse({
        data: { alert },
        requestId: request.id,
      });
    },
  });

  // Create new alert (authenticated users)
  fastify.post('/', {
    schema: {
      body: AlertRequestSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                alert: AlertSchema,
                message: { type: 'string' },
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
      const { disease, crop, severity, description, affectedAreas, location, userId, contactInfo } = request.body;
      
      // Authenticate user
      const authenticatedUser = (request as any).user;
      if (!authenticatedUser) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.UNAUTHORIZED,
          message: 'Authentication required to create alert',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(401).send(errorResponse);
      }

      try {
        // Create new alert
        const newAlert: z.infer<typeof AlertSchema> = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          disease,
          crop,
          severity,
          description,
          affectedAreas,
          reportedBy: userId || authenticatedUser.id,
          reportedAt: new Date().toISOString(),
          confirmed: false,
          status: 'active',
          recommendations: generateRecommendations(disease, crop, severity),
          source: contactInfo || 'Farmer Report',
        };

        // Add to alerts list
        alerts.unshift(newAlert);
        
        // In production, save to database
        logger.info('New disease alert created', {
          alertId: newAlert.id,
          disease,
          crop,
          severity,
          reportedBy: newAlert.reportedBy,
        });

        // Publish alert event
        try {
          await mq.publish('disease.alert', {
            alertId: newAlert.id,
            disease,
            crop,
            severity,
            affectedAreas,
            reportedBy: newAlert.reportedBy,
            timestamp: new Date().toISOString(),
          });
          
          logger.debug('Disease alert event published', { alertId: newAlert.id });
        } catch (mqError) {
          logger.warn('Failed to publish alert event', { error: mqError as Error });
        }

        return reply.status(201).send(createSuccessResponse({
          data: {
            alert: newAlert,
            message: 'Alert created successfully. Agricultural authorities will review and confirm this alert.',
          },
          requestId: request.id,
        }));
      } catch (error) {
        logger.error('Failed to create alert', {
          error: error as Error,
          userId: authenticatedUser.id,
        });
        
        const errorResponse = createErrorResponse({
          errorType: ErrorType.INTERNAL_SERVER_ERROR,
          message: 'Failed to create alert',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        
        return reply.status(500).send(errorResponse);
      }
    },
  });
};

// Generate recommendations based on disease and severity
function generateRecommendations(disease: string, crop: string, severity: string): string[] {
  const recommendations: string[] = [];
  
  // General recommendations
  recommendations.push(`Monitor ${crop} fields closely for symptoms of ${disease}`);
  recommendations.push('Report any suspicious symptoms to local agricultural extension officer');
  
  // Severity-specific recommendations
  if (severity === 'critical') {
    recommendations.push('Destroy infected plants immediately to prevent spread');
    recommendations.push('Do not use seed or planting material from infected fields');
    recommendations.push('Disinfect all farm equipment that has come into contact with infected plants');
  } else if (severity === 'high') {
    recommendations.push('Apply appropriate pesticides as per manufacturer instructions');
    recommendations.push('Implement crop rotation with non-host crops');
    recommendations.push('Use resistant varieties if available');
  } else if (severity === 'medium') {
    recommendations.push('Increase field monitoring frequency');
    recommendations.push('Implement preventive measures such as proper sanitation');
    recommendations.push('Consider biological control methods');
  }
  
  // Disease-specific recommendations
  if (disease.toLowerCase().includes('armyworm')) {
    recommendations.push('Use pheromone traps for early detection');
    recommendations.push('Apply insecticides at the right time (early morning or late evening)');
  }
  
  if (disease.toLowerCase().includes('rust') || disease.toLowerCase().includes('blight')) {
    recommendations.push('Remove and destroy infected plant debris');
    recommendations.push('Apply fungicides preventively');
    recommendations.push('Improve air circulation in the field');
  }
  
  return recommendations;
}
