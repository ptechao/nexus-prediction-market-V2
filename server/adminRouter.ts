import { adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { markets, users, fees, followerTrades, orders } from "../drizzle/schema";
import { desc, eq, sql, sum, count } from "drizzle-orm";
import { getDb } from "./db";

export const adminRouter = router({
  /**
   * Overall dashboard statistics
   */
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // 1. Total Volume (Sum of all order filled amounts or bets)
    // For simplicity, we use the sum of all filled orders in the DB
    const totalVolumeResult = await db.select({ 
      value: sum(orders.amount) 
    }).from(orders).where(eq(orders.status, 'FILLED'));
    
    // 2. User Growth
    const totalUsersResult = await db.select({ 
      count: count() 
    }).from(users);

    // 3. Platform Revenue (Fees)
    const totalFeesResult = await db.select({ 
      value: sum(fees.amount) 
    }).from(fees).where(eq(fees.status, 'PAID'));

    // 4. Active Markets
    const activeMarketsResult = await db.select({ 
      count: count() 
    }).from(markets).where(eq(markets.status, 'OPEN'));

    return {
      totalVolume: Number(totalVolumeResult[0]?.value || 0),
      totalUsers: Number(totalUsersResult[0]?.count || 0),
      totalRevenue: Number(totalFeesResult[0]?.value || 0),
      activeMarkets: Number(activeMarketsResult[0]?.count || 0),
      // Mock chart data for now
      volumeHistory: [
        { date: '2024-03-22', value: 4000 },
        { date: '2024-03-23', value: 3000 },
        { date: '2024-03-24', value: 2000 },
        { date: '2024-03-25', value: 2780 },
        { date: '2024-03-26', value: 1890 },
        { date: '2024-03-27', value: 2390 },
        { date: '2024-03-28', value: 3490 },
      ]
    };
  }),

  /**
   * Detailed markets management list
   */
  getMarkets: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(markets).limit(input.limit).offset(input.offset).orderBy(desc(markets.createdAt));
    }),

  /**
   * Manually resolve a market
   */
  resolveMarket: adminProcedure
    .input(z.object({ 
      marketId: z.number(), 
      outcome: z.enum(["YES", "NO", "DRAW", "INVALID"]) 
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(markets)
        .set({ status: 'RESOLVED', outcome: input.outcome, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(markets.id, input.marketId));

      return { success: true };
    }),

  /**
   * Update system settings
   */
  updateSettings: adminProcedure
    .input(z.object({ 
      platformFeeBps: z.number().min(0).max(1000),
      treasuryAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
    }))
    .mutation(async ({ input }) => {
      // Logic to update global config in DB or memory
      console.log("Admin updated settings:", input);
      return { success: true };
    })
});
