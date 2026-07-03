/**
 * Disease detection types
 */

import { z } from 'zod';
import { Coordinates, PaginatedQuery, PaginatedResponse } from './common.js';

// Disease categories
export enum DiseaseCategory {
  FUNGAL = 'fungal',
  BACTERIAL = 'bacterial',
  VIRAL = 'viral',
  PEST = 'pest',
  NUTRIENT_DEFICIENCY = 'nutrient_deficiency',
  ENVIRONMENTAL = 'environmental',
  UNKNOWN = 'unknown',
}

// Disease severity
export enum DiseaseSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Disease status
export enum DiseaseStatus {
  DETECTED = 'detected',
  CONFIRMED = 'confirmed',
  TREATED = 'treated',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
}

// Crop types (Kenyan focus)
export enum CropType {
  MAIZE = 'maize',
  TOMATO = 'tomato',
  POTATO = 'potato',
  CASSAVA = 'cassava',
  BEANS = 'beans',
  PEPPER = 'pepper',
  COFFEE = 'coffee',
  TEA = 'tea',
  SORGHUM = 'sorghum',
  MILLET = 'millet',
  RICE = 'rice',
  WHEAT = 'wheat',
  BANANA = 'banana',
  MANGO = 'mango',
  AVOCADO = 'avocado',
  PAWPAW = 'pawpaw',
  CABBAGE = 'cabbage',
  KALE = 'kale',
  SPINACH = 'spinach',
  ONION = 'onion',
  CARROT = 'carrot',
  OTHER = 'other',
}

// Disease information
export const DiseaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  scientificName: z.string().optional(),
  category: z.nativeEnum(DiseaseCategory),
  crops: z.array(z.nativeEnum(CropType)),
  description: z.string(),
  symptoms: z.array(z.string()),
  causes: z.array(z.string()),
  prevention: z.array(z.string()),
  treatment: z.array(z.string()),
  chemicalControl: z.array(z.string()).optional(),
  biologicalControl: z.array(z.string()).optional(),
  culturalControl: z.array(z.string()).optional(),
  severity: z.nativeEnum(DiseaseSeverity),
  spread: z.enum(['slow', 'moderate', 'fast', 'very_fast']),
  favorableConditions: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  sources: z.array(z.string().url()).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Disease = z.infer<typeof DiseaseSchema>;

// Disease detection result
export const DiseaseDetectionSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  imagePath: z.string(),
  imageUrl: z.string().url().optional(),
  detectedDisease: z.string(),
  diseaseId: z.string().optional(),
  confidence: z.number().min(0).max(1),
  cropType: z.nativeEnum(CropType).optional(),
  cropConfidence: z.number().min(0).max(1).optional(),
  location: Coordinates.optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  ward: z.string().optional(),
  status: z.nativeEnum(DiseaseStatus).default(DiseaseStatus.DETECTED),
  severity: z.nativeEnum(DiseaseSeverity).optional(),
  notes: z.string().optional(),
  treatmentApplied: z.string().optional(),
  treatmentEffective: z.boolean().optional(),
  resolvedAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DiseaseDetection = z.infer<typeof DiseaseDetectionSchema>;

// Disease detection request
export const DiseaseDetectionRequestSchema = z.object({
  image: z.string(), // base64 encoded image
  cropType: z.nativeEnum(CropType).optional(),
  location: Coordinates.optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  ward: z.string().optional(),
  notes: z.string().optional(),
});

export type DiseaseDetectionRequest = z.infer<typeof DiseaseDetectionRequestSchema>;

// Disease detection response
export const DiseaseDetectionResponseSchema = z.object({
  detection: DiseaseDetectionSchema,
  disease: DiseaseSchema.optional(),
  recommendations: z.array(z.string()),
  similarCases: z.array(DiseaseDetectionSchema).optional(),
  confidenceThreshold: z.number().min(0).max(1),
  modelVersion: z.string(),
  processingTime: z.number(), // ms
});

export type DiseaseDetectionResponse = z.infer<typeof DiseaseDetectionResponseSchema>;

// Disease query parameters
export const DiseaseQuerySchema = z.object({
  crop: z.nativeEnum(CropType).optional(),
  category: z.nativeEnum(DiseaseCategory).optional(),
  severity: z.nativeEnum(DiseaseSeverity).optional(),
  userId: z.string().optional(),
  status: z.nativeEnum(DiseaseStatus).optional(),
  county: z.string().optional(),
  page: z.string().transform(val => parseInt(val)).optional().default('1'),
  limit: z.string().transform(val => parseInt(val)).optional().default('20'),
});

export type DiseaseQuery = z.infer<typeof DiseaseQuerySchema>;

// Disease statistics
export const DiseaseStatsSchema = z.object({
  totalDetections: z.number(),
  byCrop: z.record(z.nativeEnum(CropType), z.number()),
  byCategory: z.record(z.nativeEnum(DiseaseCategory), z.number()),
  bySeverity: z.record(z.nativeEnum(DiseaseSeverity), z.number()),
  byCounty: z.record(z.string(), z.number()),
  byMonth: z.record(z.string(), z.number()),
  mostCommon: z.array(z.object({
    disease: z.string(),
    count: z.number(),
  })),
  recent: z.array(DiseaseDetectionSchema),
});

export type DiseaseStats = z.infer<typeof DiseaseStatsSchema>;

// Disease alert
export const DiseaseAlertSchema = z.object({
  id: z.string(),
  disease: z.string(),
  diseaseId: z.string(),
  category: z.nativeEnum(DiseaseCategory),
  crops: z.array(z.nativeEnum(CropType)),
  severity: z.nativeEnum(DiseaseSeverity),
  message: z.string(),
  description: z.string(),
  affectedAreas: z.array(z.string()),
  recommendations: z.array(z.string()),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DiseaseAlert = z.infer<typeof DiseaseAlertSchema>;

// Model information
export const ModelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  crop: z.nativeEnum(CropType),
  diseases: z.array(z.string()),
  size: z.number(), // bytes
  accuracy: z.number().min(0).max(1),
  inputSize: z.object({
    width: z.number(),
    height: z.number(),
    channels: z.number(),
  }),
  outputClasses: z.number(),
  framework: z.enum(['tensorflow', 'pytorch', 'onnx']),
  quantization: z.enum(['float32', 'float16', 'int8']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ModelInfo = z.infer<typeof ModelInfoSchema>;

// Model response types
export const ModelsResponseSchema = z.object({
  models: z.array(ModelInfoSchema),
});

export type ModelsResponse = z.infer<typeof ModelsResponseSchema>;

export const ModelResponseSchema = z.object({
  model: ModelInfoSchema,
});

export type ModelResponse = z.infer<typeof ModelResponseSchema>;
