/**
 * User-related types
 */

import { z } from 'zod';
import { Location, PaginatedQuery, PaginatedResponse } from './common.js';

// User roles
export enum UserRole {
  FARMER = 'farmer',
  COOPERATIVE = 'cooperative',
  AGRIBUSINESS = 'agribusiness',
  EXTENSION_OFFICER = 'extension_officer',
  RESEARCHER = 'researcher',
  GOVERNMENT = 'government',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// User status
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

// User subscription tiers
export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}

// User subscription status
export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
}

// User profile
export const UserProfileSchema = z.object({
  id: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus).default(UserRole.FARMER),
  language: z.enum(['en', 'sw', 'fr', 'pt']).default('sw'),
  avatar: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastActiveAt: z.string().datetime().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Farmer profile extension
export const FarmerProfileSchema = z.object({
  userId: z.string(),
  farmSize: z.number().positive().optional(), // hectares
  farmSizeUnit: z.enum(['hectares', 'acres']).default('hectares'),
  yearsFarming: z.number().nonnegative().optional(),
  primaryCrop: z.string().optional(),
  crops: z.array(z.string()).optional(),
  livestock: z.array(z.string()).optional(),
  irrigationType: z.enum(['rainfed', 'drip', 'sprinkler', 'flood', 'none']).optional(),
  irrigationSource: z.enum(['river', 'borehole', 'well', 'rainwater', 'municipal', 'none']).optional(),
  soilType: z.string().optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  ward: z.string().optional(),
  village: z.string().optional(),
  gpsLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
  }).optional(),
  elevation: z.number().optional(), // meters
  agroEcologicalZone: z.string().optional(),
  cooperativeId: z.string().optional(),
  cooperativeName: z.string().optional(),
  certification: z.array(z.string()).optional(), // e.g., ['organic', 'fair_trade']
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type FarmerProfile = z.infer<typeof FarmerProfileSchema>;

// Cooperative profile extension
export const CooperativeProfileSchema = z.object({
  userId: z.string(),
  name: z.string(),
  registrationNumber: z.string().optional(),
  yearFounded: z.number().optional(),
  location: Location,
  contactPhone: z.string(),
  contactEmail: z.string().email().optional(),
  website: z.string().url().optional(),
  membersCount: z.number().nonnegative().default(0),
  primaryCrops: z.array(z.string()).optional(),
  servicesOffered: z.array(z.enum([
    'input_supply',
    'marketing',
    'processing',
    'credit',
    'training',
    'extension',
    'storage',
    'transport',
    'other',
  ])).optional(),
  certification: z.array(z.string()).optional(),
  bankAccount: z.object({
    bankName: z.string(),
    accountNumber: z.string(),
    accountName: z.string(),
    branch: z.string().optional(),
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CooperativeProfile = z.infer<typeof CooperativeProfileSchema>;

// Agribusiness profile extension
export const AgribusinessProfileSchema = z.object({
  userId: z.string(),
  name: z.string(),
  registrationNumber: z.string().optional(),
  yearFounded: z.number().optional(),
  location: Location,
  contactPhone: z.string(),
  contactEmail: z.string().email().optional(),
  website: z.string().url().optional(),
  businessType: z.enum([
    'input_supplier',
    'processor',
    'exporter',
    'importer',
    'retailer',
    'wholesaler',
    'logistics',
    'financial',
    'technology',
    'consultancy',
    'other',
  ]),
  products: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  targetMarkets: z.array(z.string()).optional(),
  certification: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AgribusinessProfile = z.infer<typeof AgribusinessProfileSchema>;

// User subscription
export const SubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tier: z.nativeEnum(SubscriptionTier),
  status: z.nativeEnum(SubscriptionStatus),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  trialStart: z.string().datetime().optional(),
  trialEnd: z.string().datetime().optional(),
  cancelAtPeriodEnd: z.boolean().default(false),
  cancelledAt: z.string().datetime().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().default('KES'),
  paymentMethod: z.enum(['mobile_money', 'bank_transfer', 'card', 'cash', 'other']).optional(),
  paymentReference: z.string().optional(),
  invoiceNumber: z.string().optional(),
  features: z.array(z.string()).optional(),
  limits: z.record(z.number()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

// User device
export const DeviceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fcmToken: z.string().optional(),
  apnsToken: z.string().optional(),
  platform: z.enum(['android', 'ios', 'web']),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
  deviceModel: z.string().optional(),
  manufacturer: z.string().optional(),
  lastSeen: z.string().datetime(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
});

export type Device = z.infer<typeof DeviceSchema>;

// User preferences
export const UserPreferencesSchema = z.object({
  id: z.string(),
  userId: z.string(),
  language: z.enum(['en', 'sw', 'fr', 'pt']),
  units: z.object({
    temperature: z.enum(['celsius', 'fahrenheit']),
    distance: z.enum(['km', 'miles']),
    area: z.enum(['hectares', 'acres']),
    weight: z.enum(['kg', 'lbs', 'tonnes']),
    volume: z.enum(['litres', 'gallons']),
    currency: z.string(),
  }),
  notifications: z.object({
    weatherAlerts: z.boolean().default(true),
    marketUpdates: z.boolean().default(true),
    advisory: z.boolean().default(true),
    diseaseAlerts: z.boolean().default(true),
    dailyReport: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(true),
    email: z.boolean().default(false),
  }),
  privacy: z.object({
    shareData: z.boolean().default(true),
    shareLocation: z.boolean().default(true),
    shareAnalytics: z.boolean().default(true),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// User authentication
export const AuthCredentialsSchema = z.object({
  phone: z.string(),
  password: z.string().optional(),
  otp: z.string().optional(),
  deviceToken: z.string().optional(),
});

export type AuthCredentials = z.infer<typeof AuthCredentialsSchema>;

export const AuthResponseSchema = z.object({
  user: UserProfileSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(), // seconds
  tokenType: z.string().default('Bearer'),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresIn: z.number(),
  tokenType: z.string().default('Bearer'),
});

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

// User query parameters
export const UserQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  ward: z.string().optional(),
  page: z.string().transform(val => parseInt(val)).optional().default('1'),
  limit: z.string().transform(val => parseInt(val)).optional().default('20'),
});

export type UserQuery = z.infer<typeof UserQuerySchema>;

// User request types
export const CreateUserRequestSchema = z.object({
  phone: z.string(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().optional(),
  role: z.nativeEnum(UserRole).optional().default(UserRole.FARMER),
  language: z.enum(['en', 'sw']).optional().default('sw'),
  deviceToken: z.string().optional(),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const UpdateUserRequestSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  language: z.enum(['en', 'sw', 'fr', 'pt']).optional(),
  avatar: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
});

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

export const UpdateFarmerProfileRequestSchema = z.object({
  farmSize: z.number().positive().optional(),
  farmSizeUnit: z.enum(['hectares', 'acres']).optional(),
  yearsFarming: z.number().nonnegative().optional(),
  primaryCrop: z.string().optional(),
  crops: z.array(z.string()).optional(),
  livestock: z.array(z.string()).optional(),
  irrigationType: z.enum(['rainfed', 'drip', 'sprinkler', 'flood', 'none']).optional(),
  irrigationSource: z.enum(['river', 'borehole', 'well', 'rainwater', 'municipal', 'none']).optional(),
  soilType: z.string().optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  ward: z.string().optional(),
  village: z.string().optional(),
  gpsLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
  }).optional(),
  elevation: z.number().optional(),
  agroEcologicalZone: z.string().optional(),
  cooperativeId: z.string().optional(),
  cooperativeName: z.string().optional(),
  certification: z.array(z.string()).optional(),
});

export type UpdateFarmerProfileRequest = z.infer<typeof UpdateFarmerProfileRequestSchema>;

// User response types
export const UserResponseSchema = z.object({
  user: UserProfileSchema,
  farmerProfile: FarmerProfileSchema.optional(),
  cooperativeProfile: CooperativeProfileSchema.optional(),
  agribusinessProfile: AgribusinessProfileSchema.optional(),
  subscription: SubscriptionSchema.optional(),
  preferences: UserPreferencesSchema.optional(),
  devices: z.array(DeviceSchema).optional(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

export const UsersResponseSchema = z.object({
  users: z.array(UserProfileSchema),
  pagination: PaginatedResponse<UserProfile>['pagination'],
});

export type UsersResponse = z.infer<typeof UsersResponseSchema>;
