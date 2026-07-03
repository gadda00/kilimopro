/**
 * Disease Model Routes
 * Manages ML models for disease detection
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getLogger } from '@kilimopro/logger';
import { getCacheClient } from '@kilimopro/cache-client';
import { createSuccessResponse, createErrorResponse, ErrorType } from '@kilimopro/shared-types';
import { config } from '../config/index.js';

const logger = getLogger('disease-service:models');
const cache = getCacheClient('disease-service');

// Schemas
const ModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  cropTypes: z.array(z.string()),
  diseases: z.array(z.string()),
  accuracy: z.number().min(0).max(100),
  size: z.number(),
  format: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: z.enum(['active', 'deprecated', 'testing']),
});

// Sample models
const models: z.infer<typeof ModelSchema>[] = [
  {
    id: 'model-001',
    name: 'Crop Disease Detection v1.0',
    version: '1.0.0',
    description: 'MobileNetV3-based model for detecting common crop diseases in Kenya. Trained on PlantVillage dataset with Kenyan-specific fine-tuning.',
    cropTypes: ['maize', 'tomato', 'beans', 'potato', 'coffee'],
    diseases: [
      'Fall Armyworm', 'Maize Leaf Rust', 'Maize Stalk Rot',
      'Early Blight', 'Late Blight',
      'Angular Leaf Spot', 'Bean Rust',
      'Potato Blight', 'Potato Scab',
      'Coffee Berry Disease', 'Coffee Leaf Rust',
    ],
    accuracy: 88.5,
    size: 8423456, // ~8.4MB
    format: 'TensorFlow Lite',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-20T14:30:00Z',
    status: 'active',
  },
  {
    id: 'model-002',
    name: 'Maize Disease Specialist',
    version: '1.1.0',
    description: 'Specialized model for maize diseases with higher accuracy. Optimized for Kenyan maize varieties.',
    cropTypes: ['maize'],
    diseases: [
      'Fall Armyworm', 'Maize Leaf Rust', 'Maize Stalk Rot',
      'Northern Corn Leaf Blight', 'Gray Leaf Spot',
      'Common Rust', 'Southern Rust',
    ],
    accuracy: 92.3,
    size: 5242880, // ~5.2MB
    format: 'TensorFlow Lite',
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2024-07-01T11:45:00Z',
    status: 'active',
  },
  {
    id: 'model-003',
    name: 'Tomato Disease Expert',
    version: '1.0.0',
    description: 'High-accuracy model for tomato diseases. Includes detection for bacterial, fungal, and viral diseases.',
    cropTypes: ['tomato'],
    diseases: [
      'Early Blight', 'Late Blight', 'Septoria Leaf Spot',
      'Bacterial Spot', 'Bacterial Speck',
      'Tomato Mosaic Virus', 'Tomato Yellow Leaf Curl Virus',
      'Fusarium Wilt', 'Verticillium Wilt',
    ],
    accuracy: 91.7,
    size: 6553600, // ~6.5MB
    format: 'TensorFlow Lite',
    createdAt: '2024-02-20T13:00:00Z',
    updatedAt: '2024-06-15T16:20:00Z',
    status: 'active',
  },
];

export const modelRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all models
  fastify.get('/', {
    schema: {
      querystring: z.object({
        crop: z.string().optional(),
        status: z.enum(['active', 'deprecated', 'testing']).optional(),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                models: { type: 'array', items: ModelSchema },
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
      const { crop, status } = request.query as { crop?: string; status?: string };
      
      // Generate cache key
      const cacheKey = `disease:models:${crop}:${status}`;
      
      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for models', { cacheKey });
        return JSON.parse(cached);
      }

      // Filter models
      let filteredModels = [...models];
      
      if (crop) {
        filteredModels = filteredModels.filter(model => 
          model.cropTypes.includes(crop.toLowerCase())
        );
      }

      if (status) {
        filteredModels = filteredModels.filter(model => model.status === status);
      }

      const response = createSuccessResponse({
        data: {
          models: filteredModels,
          total: filteredModels.length,
        },
        requestId: request.id,
      });

      // Cache the response
      await cache.set(cacheKey, JSON.stringify(response), config.cache.ttl.models);
      
      return response;
    },
  });

  // Get specific model by ID
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
                model: ModelSchema,
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
      
      const model = models.find(m => m.id === id);
      
      if (!model) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.NOT_FOUND,
          message: 'Model not found',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(404).send(errorResponse);
      }

      return createSuccessResponse({
        data: { model },
        requestId: request.id,
      });
    },
  });

  // Get latest model for a crop
  fastify.get('/latest/:crop', {
    schema: {
      params: z.object({
        crop: z.string(),
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                model: ModelSchema,
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
      const { crop } = request.params as { crop: string };
      
      const cropModels = models.filter(m => m.cropTypes.includes(crop.toLowerCase()));
      
      if (cropModels.length === 0) {
        const errorResponse = createErrorResponse({
          errorType: ErrorType.NOT_FOUND,
          message: `No models available for ${crop}`,
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
        return reply.status(404).send(errorResponse);
      }

      // Get the most recent active model
      const activeModels = cropModels.filter(m => m.status === 'active');
      const latestModel = activeModels.length > 0 
        ? activeModels.reduce((latest, current) => 
            new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
          )
        : cropModels.reduce((latest, current) => 
            new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
          );

      return createSuccessResponse({
        data: { model: latestModel },
        requestId: request.id,
      });
    },
  });
};
