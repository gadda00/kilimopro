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