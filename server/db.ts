import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, farms, climateAlerts, InsertFarm, InsertClimateAlert, marketPrices, diseaseDetections, InsertDiseaseDetection, educationalContent, chatHistory, InsertChatHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLanguage(userId: number, language: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(users).set({ language: language as any }).where(eq(users.id, userId));
}

// Farm queries
export async function getUserFarms(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(farms).where(eq(farms.userId, userId));
}

export async function createFarm(farmData: InsertFarm) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(farms).values(farmData);
  return result;
}

// Climate alerts queries
export async function getUserAlerts(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(climateAlerts)
    .where(eq(climateAlerts.userId, userId))
    .orderBy((t) => t.createdAt)
    .limit(limit);
}

export async function createAlert(alertData: InsertClimateAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(climateAlerts).values(alertData);
}

// Market prices queries
export async function getMarketPrices(crop: string, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(marketPrices)
    .where(eq(marketPrices.crop, crop))
    .orderBy((t) => t.date)
    .limit(limit);
}

// Disease detection queries
export async function getUserDiseaseDetections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(diseaseDetections)
    .where(eq(diseaseDetections.userId, userId))
    .orderBy((t) => t.createdAt);
}

export async function createDiseaseDetection(detectionData: InsertDiseaseDetection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(diseaseDetections).values(detectionData);
}

// Educational content queries
export async function getEducationalContent(language: "en" | "sw" = "en") {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(educationalContent)
    .where(eq(educationalContent.language, language));
}

// Chat history queries
export async function getUserChatHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatHistory)
    .where(eq(chatHistory.userId, userId))
    .orderBy((t) => t.createdAt)
    .limit(limit);
}

export async function saveChatMessage(messageData: InsertChatHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(chatHistory).values(messageData);
}
