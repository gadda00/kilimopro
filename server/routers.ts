import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";



export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Farm management
  farm: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserFarms(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        farmName: z.string().min(1),
        latitude: z.string(),
        longitude: z.string(),
        areaHectares: z.string().optional(),
        primaryCrop: z.string().optional(),
        soilType: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createFarm({
          userId: ctx.user.id,
          ...input,
        })
      ),
  }),

  // Climate alerts
  alerts: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(({ ctx, input }) =>
        db.getUserAlerts(ctx.user.id, input?.limit || 20)
      ),
  }),

  // Market prices
  market: router({
    prices: publicProcedure
      .input(z.object({ crop: z.string(), limit: z.number().default(50).optional() }))
      .query(({ input }) =>
        db.getMarketPrices(input.crop, input.limit || 50)
      ),
  }),

  // Disease detection
  disease: router({
    history: protectedProcedure.query(({ ctx }) =>
      db.getUserDiseaseDetections(ctx.user.id)
    ),
    detect: protectedProcedure
      .input(z.object({
        crop: z.string(),
        disease: z.string(),
        confidence: z.string(),
        imageUrl: z.string().optional(),
        treatment: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createDiseaseDetection({
          userId: ctx.user.id,
          ...input,
        } as any)
      ),
  }),

  // Educational content
  education: router({
    content: publicProcedure
      .input(z.object({ language: z.enum(["en", "sw"]).default("en") }).optional())
      .query(({ input }) =>
        db.getEducationalContent((input?.language || "en") as "en" | "sw")
      ),
  }),

  // Chat history
  chat: router({
    history: protectedProcedure.query(({ ctx }) =>
      db.getUserChatHistory(ctx.user.id)
    ),
    send: protectedProcedure
      .input(z.object({
        userMessage: z.string(),
        assistantMessage: z.string(),
        context: z.any().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.saveChatMessage({
          userId: ctx.user.id,
          ...input,
        } as any)
      ),
  }),

  // User settings
  user: router({
    updateLanguage: protectedProcedure
      .input(z.object({ language: z.enum(["en", "sw"]) }))
      .mutation(({ ctx, input }) =>
        db.updateUserLanguage(ctx.user.id, input.language as any)
      ),
  }),
});

export type AppRouter = typeof appRouter;
