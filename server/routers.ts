import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { fetchTopMarkets, fetchMarketsByTag, fetchMarketById } from "./polymarket";
import { fetchWorldCupMarkets, fetchWorldCupMarketById, fetchTrendingWorldCupMarkets } from "./worldcup";
import { generateMatchPrediction } from "./worldcupAiPrediction";
import { translateText } from "./translation";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
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

  markets: router({
    /** Fetch top markets by volume from Polymarket */
    top: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit ?? 10;
        return fetchTopMarkets(limit);
      }),

    /** Fetch a single market by ID */
    byId: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return fetchMarketById(input.id);
      }),

    /** Fetch markets filtered by tag */
    byTag: publicProcedure
      .input(z.object({
        tag: z.string(),
        limit: z.number().min(1).max(50).default(10),
      }))
      .query(async ({ input }) => {
        return fetchMarketsByTag(input.tag, input.limit);
      }),
    /** Fetch World Cup markets */
    worldCup: publicProcedure.query(async () => {
      return fetchWorldCupMarkets();
    }),
    /** Fetch trending World Cup markets */
    worldCupTrending: publicProcedure.query(async () => {
      return fetchTrendingWorldCupMarkets();
    }),
    /** Fetch World Cup market by ID */
    worldCupById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return fetchWorldCupMarketById(input.id);
      }),
    /** Get AI prediction for a World Cup match */
    worldCupPrediction: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { WORLD_CUP_MATCHES } = await import("./data/worldcupMatches");
        const originalMatch = WORLD_CUP_MATCHES.find(m => m.id === input.id);
        if (!originalMatch) return null;
        return generateMatchPrediction(originalMatch);
      }),

    /** Fetch markets from the local database (Kalshi, PredictIt, Manifold, etc.) */
    nexus: publicProcedure
      .input(z.object({ 
        category: z.string().optional(),
        limit: z.number().min(1).max(100).default(50)
      }).optional())
      .query(async ({ input }) => {
        try {
          const { getDb } = await import("./db");
          const { markets } = await import("../drizzle/schema");
          const { desc, eq } = await import("drizzle-orm");
          
          const db = await getDb();
          if (!db) {
            console.warn("[TRPC markets.nexus] Database unavailable");
            return [];
          }

          const limit = input?.limit ?? 50;
          const category = input?.category;

          let query = db.select().from(markets);
          
          if (category && category !== 'all') {
            // @ts-ignore
            query = query.where(eq(markets.category, category));
          }

          return await query.orderBy(desc(markets.createdAt)).limit(limit);
        } catch (error) {
          console.error("[TRPC markets.nexus] Failure:", error);
          return [];
        }
      }),

    /** Fetch live markets directly from sources (bypass DB) */
    live: publicProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ input }) => {
        const { 
          fetchKalshiMarkets, 
          fetchPredictItMarkets, 
          fetchManifoldMarkets 
        } = await import("./services/sources/externalMarkets");
        const { fetchTopMarkets } = await import("./polymarket");

        try {
          const [kalshi, predictIt, manifold, polymarket] = await Promise.all([
            fetchKalshiMarkets().catch(e => { console.error("Kalshi fetch error:", e); return []; }),
            fetchPredictItMarkets().catch(e => { console.error("PredictIt fetch error:", e); return []; }),
            fetchManifoldMarkets().catch(e => { console.error("Manifold fetch error:", e); return []; }),
            fetchTopMarkets(20).then(m => m.map(pm => ({
              source: "polymarket",
              sourceId: String(pm.id),
              title: pm.title,
              description: pm.description,
              category: pm.category,
              eventType: pm.eventType,
              startTime: new Date().toISOString(),
              endTime: pm.endDate,
              image: pm.image || undefined,
              tags: [pm.category, "Polymarket"],
              yesOdds: pm.yesOdds,
              noOdds: pm.noOdds
            }))).catch(e => { console.error("Polymarket fetch error:", e); return []; })
          ]);

          let combined = [...kalshi, ...predictIt, ...manifold, ...polymarket];

          if (input.category && input.category !== 'all') {
            combined = combined.filter(m => m.category.toLowerCase() === input.category?.toLowerCase());
          }

          if (combined.length === 0) {
            console.warn("[TRPC markets.live] No markets fetched from any source");
          }

          return combined.map(m => ({
            id: String(m.sourceId),
            title: m.title,
            description: m.description,
            category: m.category,
            endDate: m.endTime,
            yesOdds: m.yesOdds || 50,
            noOdds: m.noOdds || 50,
            totalPool: 1000,
            volume24h: 100,
            participants: 10,
            isTrending: false,
            image: m.image
          }));
        } catch (error) {
          console.error("[TRPC markets.live] Fatal failure:", error);
          return [];
        }
      }),

    /** Trigger the market synchronization job manually */
    sync: publicProcedure
      .mutation(async () => {
        const { createMarketsJob } = await import("./jobs/createMarkets");
        try {
          const result = await createMarketsJob({ mockMode: false });
          return { success: true, ...result };
        } catch (error) {
          console.error("Manual sync failed:", error);
          throw new Error(error instanceof Error ? error.message : "Sync failed");
        }
      }),
  }),
  
  translation: router({
    text: publicProcedure
      .input(z.object({
        text: z.string(),
        targetLang: z.string(),
        sourceLang: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return translateText(input.text, input.targetLang, input.sourceLang);
      }),
  }),
});

export type AppRouter = typeof appRouter;
