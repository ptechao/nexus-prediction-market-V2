import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { fetchTopMarkets, fetchMarketsByTag, fetchMarketById } from "./polymarket";

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
  }),
});

export type AppRouter = typeof appRouter;
