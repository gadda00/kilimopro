import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  language: mysqlEnum("language", ["en", "sw"]).default("en").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Farms table for storing farmer's farm information
export const farms = mysqlTable("farms", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  farmName: varchar("farmName", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  areaHectares: decimal("areaHectares", { precision: 8, scale: 2 }),
  primaryCrop: varchar("primaryCrop", { length: 100 }),
  soilType: varchar("soilType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Farm = typeof farms.$inferSelect;
export type InsertFarm = typeof farms.$inferInsert;

// Climate alerts table
export const climateAlerts = mysqlTable("climateAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  farmId: int("farmId"),
  alertType: mysqlEnum("alertType", ["drought", "flood", "pest", "rainfall", "temperature", "wind"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  recommendation: text("recommendation"),
  source: varchar("source", { length: 100 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClimateAlert = typeof climateAlerts.$inferSelect;
export type InsertClimateAlert = typeof climateAlerts.$inferInsert;

// Market prices table
export const marketPrices = mysqlTable("marketPrices", {
  id: int("id").autoincrement().primaryKey(),
  crop: varchar("crop", { length: 100 }).notNull(),
  market: varchar("market", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  date: timestamp("date").notNull(),
  source: varchar("source", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketPrice = typeof marketPrices.$inferSelect;
export type InsertMarketPrice = typeof marketPrices.$inferInsert;

// Disease detections table
export const diseaseDetections = mysqlTable("diseaseDetections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  farmId: int("farmId"),
  crop: varchar("crop", { length: 100 }).notNull(),
  disease: varchar("disease", { length: 255 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  treatment: text("treatment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DiseaseDetection = typeof diseaseDetections.$inferSelect;
export type InsertDiseaseDetection = typeof diseaseDetections.$inferInsert;

// Educational content table
export const educationalContent = mysqlTable("educationalContent", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  contentType: mysqlEnum("contentType", ["article", "video", "calendar", "guide"]).notNull(),
  contentUrl: text("contentUrl"),
  language: mysqlEnum("language", ["en", "sw"]).default("en").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EducationalContent = typeof educationalContent.$inferSelect;
export type InsertEducationalContent = typeof educationalContent.$inferInsert;

// Chat history table for Ask KilimoPRO
export const chatHistory = mysqlTable("chatHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  farmId: int("farmId"),
  userMessage: text("userMessage").notNull(),
  assistantMessage: text("assistantMessage").notNull(),
  context: json("context"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatHistory = typeof chatHistory.$inferSelect;
export type InsertChatHistory = typeof chatHistory.$inferInsert;

// ============================================
// KILIMOPRO 2.0 — IGAD MULTI-COUNTRY TABLES
// ============================================

// IGAD Countries (8 East African nations)
export const countries = mysqlTable("countries", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 2 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  iso3: varchar("iso3", { length: 3 }).notNull(),
  faoCode: varchar("faoCode", { length: 10 }),
  currency: varchar("currency", { length: 3 }).notNull(),
  flag: varchar("flag", { length: 5 }),
  igadMember: boolean("igadMember").default(true).notNull(),
  capitalLatitude: decimal("capitalLatitude", { precision: 10, scale: 7 }),
  capitalLongitude: decimal("capitalLongitude", { precision: 11, scale: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Country = typeof countries.$inferSelect;
export type InsertCountry = typeof countries.$inferInsert;

// Regions/Provinces/Counties
export const regions = mysqlTable("regions", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("countryCode", { length: 2 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 11, scale: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Region = typeof regions.$inferSelect;
export type InsertRegion = typeof regions.$inferInsert;

// Crops with FAOSTAT codes
export const crops = mysqlTable("crops", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  scientificName: varchar("scientificName", { length: 100 }),
  category: varchar("category", { length: 50 }).notNull(),
  faostatCode: varchar("faostatCode", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Crop = typeof crops.$inferSelect;
export type InsertCrop = typeof crops.$inferInsert;

// Markets
export const markets = mysqlTable("markets", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("countryCode", { length: 2 }).notNull(),
  regionCode: varchar("regionCode", { length: 10 }),
  name: varchar("name", { length: 100 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 11, scale: 7 }),
  marketType: varchar("marketType", { length: 50 }).default("wholesale"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Market = typeof markets.$inferSelect;
export type InsertMarket = typeof markets.$inferInsert;

// Climate Data (cached from Open-Meteo + ICPAC)
export const climateData = mysqlTable("climateData", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("countryCode", { length: 2 }).notNull(),
  regionCode: varchar("regionCode", { length: 10 }),
  date: timestamp("date").notNull(),
  temperatureMin: decimal("temperatureMin", { precision: 5, scale: 2 }),
  temperatureMax: decimal("temperatureMax", { precision: 5, scale: 2 }),
  temperatureAvg: decimal("temperatureAvg", { precision: 5, scale: 2 }),
  rainfall: decimal("rainfall", { precision: 8, scale: 2 }),
  humidity: decimal("humidity", { precision: 5, scale: 2 }),
  windSpeed: decimal("windSpeed", { precision: 5, scale: 2 }),
  soilMoisture: decimal("soilMoisture", { precision: 5, scale: 2 }),
  source: varchar("source", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClimateDatum = typeof climateData.$inferSelect;
export type InsertClimateDatum = typeof climateData.$inferInsert;

// Hazard Alerts (from ICPAC)
export const hazardAlerts = mysqlTable("hazardAlerts", {
  id: int("id").autoincrement().primaryKey(),
  alertType: mysqlEnum("alertType", ["drought", "flood", "pest", "rainfall", "extreme_rainfall", "locust"]).notNull(),
  severity: mysqlEnum("severity", ["low", "moderate", "high", "extreme"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  affectedCountries: json("affectedCountries").notNull(),
  affectedRegions: json("affectedRegions"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  source: varchar("source", { length: 50 }).default("ICPAC").notNull(),
  advisory: text("advisory"),
  mitigationMeasures: json("mitigationMeasures"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HazardAlert = typeof hazardAlerts.$inferSelect;
export type InsertHazardAlert = typeof hazardAlerts.$inferInsert;

// Agriculture Watch (from ICPAC — monthly agricultural conditions report)
export const agricultureWatch = mysqlTable("agricultureWatch", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  summary: text("summary").notNull(),
  cropConditions: json("cropConditions").notNull(),
  rangelandConditions: json("rangelandConditions").notNull(),
  rainfallAnomalies: json("rainfallAnomalies"),
  soilMoisture: json("soilMoisture"),
  vegetationIndex: json("vegetationIndex"),
  source: varchar("source", { length: 50 }).default("ICPAC").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgricultureWatch = typeof agricultureWatch.$inferSelect;
export type InsertAgricultureWatch = typeof agricultureWatch.$inferInsert;

// Advisory Content (agricultural recommendations per country/crop)
export const advisoryContent = mysqlTable("advisoryContent", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("countryCode", { length: 2 }),
  cropCode: varchar("cropCode", { length: 10 }),
  advisoryType: mysqlEnum("advisoryType", ["planting", "harvesting", "fertilizer", "pest_control", "irrigation", "general"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  language: mysqlEnum("language", ["en", "sw", "am", "ar", "so"]).default("en").notNull(),
  season: varchar("season", { length: 50 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdvisoryContentItem = typeof advisoryContent.$inferSelect;
export type InsertAdvisoryContent = typeof advisoryContent.$inferInsert;

// SMS Logs (for Africa's Talking / Twilio integration)
export const smsLogs = mysqlTable("smsLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  message: text("message").notNull(),
  direction: mysqlEnum("direction", ["in", "out"]).notNull(),
  status: mysqlEnum("status", ["sent", "delivered", "failed", "read", "pending"]).notNull(),
  gateway: varchar("gateway", { length: 50 }),
  gatewayMessageId: varchar("gatewayMessageId", { length: 100 }),
  cost: decimal("cost", { precision: 10, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SmsLog = typeof smsLogs.$inferSelect;
export type InsertSmsLog = typeof smsLogs.$inferInsert;

// USSD Sessions
export const ussdSessions = mysqlTable("ussdSessions", {
  id: int("id").autoincrement().primaryKey(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  network: varchar("network", { length: 50 }),
  currentMenu: varchar("currentMenu", { length: 100 }),
  menuHistory: json("menuHistory"),
  userInput: json("userInput"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UssdSession = typeof ussdSessions.$inferSelect;
export type InsertUssdSession = typeof ussdSessions.$inferInsert;