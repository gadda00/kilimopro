/**
 * Advisory-related types
 */

import { z } from 'zod';
import { Coordinates, Location, PaginatedQuery, PaginatedResponse } from './common.js';
import { CropType } from './disease.js';

// Advisory types
export enum AdvisoryType {
  GENERAL = 'general',
  WEATHER_BASED = 'weather_based',
  CROP_SPECIFIC = 'crop_specific',
  SOIL_BASED = 'soil_based',
  MARKET_BASED = 'market_based',
  PEST_ALERT = 'pest_alert',
  DISEASE_ALERT = 'disease_alert',
  IRRIGATION = 'irrigation',
  FERTILIZATION = 'fertilization',
  HARVEST = 'harvest',
  POST_HARVEST = 'post_harvest',
  FINANCIAL = 'financial',
  CLIMATE = 'climate',
}

// Advisory priority
export enum AdvisoryPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Advisory status
export enum AdvisoryStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

// Advisory delivery method
export enum AdvisoryDeliveryMethod {
  IN_APP = 'in_app',
  SMS = 'sms',
  USSD = 'ussd',
  EMAIL = 'email',
  PUSH = 'push',
  VOICE = 'voice',
}

// Advisory content
export const AdvisorySchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  summary: z.string().optional(),
  type: z.nativeEnum(AdvisoryType),
  priority: z.nativeEnum(AdvisoryPriority).default(AdvisoryPriority.MEDIUM),
  status: z.nativeEnum(AdvisoryStatus).default(AdvisoryStatus.DRAFT),
  authorId: z.string().optional(),
  authorName: z.string().optional(),
  targetAudience: z.array(z.enum(['farmer', 'cooperative', 'agribusiness', 'extension', 'all'])),
  crops: z.array(z.nativeEnum(CropType)).optional(),
  counties: z.array(z.string()).optional(),
  subCounties: z.array(z.string()).optional(),
  wards: z.array(z.string()).optional(),
  location: Location.optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime().optional(),
  publishAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
  archivedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['image', 'video', 'audio', 'document']),
    title: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  relatedAdvisories: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  version: z.number().default(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Advisory = z.infer<typeof AdvisorySchema>;

// Personalized advisory
export const PersonalizedAdvisorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  advisoryId: z.string(),
  title: z.string(),
  content: z.string(),
  summary: z.string().optional(),
  type: z.nativeEnum(AdvisoryType),
  priority: z.nativeEnum(AdvisoryPriority),
  status: z.enum(['pending', 'read', 'actioned', 'dismissed']),
  readAt: z.string().datetime().optional(),
  actionedAt: z.string().datetime().optional(),
  dismissedAt: z.string().datetime().optional(),
  actionTaken: z.string().optional(),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  context: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PersonalizedAdvisory = z.infer<typeof PersonalizedAdvisorySchema>;

// Advisory delivery
export const AdvisoryDeliverySchema = z.object({
  id: z.string(),
  advisoryId: z.string(),
  userId: z.string(),
  method: z.nativeEnum(AdvisoryDeliveryMethod),
  status: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']),
  recipient: z.string(), // phone, email, device token
  sentAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  readAt: z.string().datetime().optional(),
  failedAt: z.string().datetime().optional(),
  errorMessage: z.string().optional(),
  retryCount: z.number().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AdvisoryDelivery = z.infer<typeof AdvisoryDeliverySchema>;

// Advisory request
export const AdvisoryRequestSchema = z.object({
  userId: z.string(),
  type: z.nativeEnum(AdvisoryType).optional(),
  crops: z.array(z.nativeEnum(CropType)).optional(),
  location: Coordinates.optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  ward: z.string().optional(),
  farmSize: z.number().optional(),
  soilType: z.string().optional(),
  irrigationType: z.string().optional(),
  weather: z.record(z.any()).optional(),
  marketData: z.record(z.any()).optional(),
  diseaseData: z.record(z.any()).optional(),
  query: z.string().optional(),
  language: z.enum(['en', 'sw']).optional().default('sw'),
});

export type AdvisoryRequest = z.infer<typeof AdvisoryRequestSchema>;

// Advisory response
export const AdvisoryResponseSchema = z.object({
  advisory: AdvisorySchema,
  personalized: PersonalizedAdvisorySchema.optional(),
  relatedAdvisories: z.array(AdvisorySchema).optional(),
  recommendations: z.array(z.string()).optional(),
});

export type AdvisoryResponse = z.infer<typeof AdvisoryResponseSchema>;

// Advisory query parameters
export const AdvisoryQuerySchema = z.object({
  type: z.nativeEnum(AdvisoryType).optional(),
  priority: z.nativeEnum(AdvisoryPriority).optional(),
  status: z.nativeEnum(AdvisoryStatus).optional(),
  authorId: z.string().optional(),
  crop: z.nativeEnum(CropType).optional(),
  county: z.string().optional(),
  tag: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform(val => parseInt(val)).optional().default('1'),
  limit: z.string().transform(val => parseInt(val)).optional().default('20'),
});

export type AdvisoryQuery = z.infer<typeof AdvisoryQuerySchema>;

// Advisory statistics
export const AdvisoryStatsSchema = z.object({
  total: z.number(),
  byType: z.record(z.nativeEnum(AdvisoryType), z.number()),
  byPriority: z.record(z.nativeEnum(AdvisoryPriority), z.number()),
  byStatus: z.record(z.nativeEnum(AdvisoryStatus), z.number()),
  byCrop: z.record(z.string(), z.number()),
  byCounty: z.record(z.string(), z.number()),
  recent: z.array(AdvisorySchema),
  popular: z.array(AdvisorySchema),
});

export type AdvisoryStats = z.infer<typeof AdvisoryStatsSchema>;

// Council deliberation types (for multi-agent AI)
export enum CouncilPersonaRole {
  AGRONOMIST = 'agronomist',
  ECONOMIST = 'economist',
  CLIMATE_SCIENTIST = 'climate_scientist',
  EXTENSION_OFFICER = 'extension_officer',
  RISK_MANAGER = 'risk_manager',
}

export const CouncilPersonaSchema = z.object({
  name: z.string(),
  role: z.nativeEnum(CouncilPersonaRole),
  systemPrompt: z.string(),
  perspective: z.string(),
  expertise: z.array(z.string()),
});

export type CouncilPersona = z.infer<typeof CouncilPersonaSchema>;

export const CouncilResponseSchema = z.object({
  persona: z.string(),
  role: z.nativeEnum(CouncilPersonaRole),
  analysis: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()).optional(),
});

export type CouncilResponse = z.infer<typeof CouncilResponseSchema>;

export const CouncilDeliberationSchema = z.object({
  question: z.string(),
  context: z.record(z.any()),
  responses: z.array(CouncilResponseSchema),
  synthesis: z.string(),
  finalRecommendation: z.string(),
  consensus: z.enum(['strong', 'moderate', 'divided']),
  confidence: z.number().min(0).max(1),
  createdAt: z.string().datetime(),
});

export type CouncilDeliberation = z.infer<typeof CouncilDeliberationSchema>;

// Council request
export const CouncilRequestSchema = z.object({
  question: z.string(),
  context: z.record(z.any()).optional(),
  personas: z.array(z.nativeEnum(CouncilPersonaRole)).optional(),
  language: z.enum(['en', 'sw']).optional().default('sw'),
});

export type CouncilRequest = z.infer<typeof CouncilRequestSchema>;

// Council response
export const CouncilResponseFullSchema = z.object({
  deliberation: CouncilDeliberationSchema,
  recommendations: z.array(z.string()),
  actionItems: z.array(z.string()).optional(),
});

export type CouncilResponseFull = z.infer<typeof CouncilResponseFullSchema>;
