import { getDb } from "../db";
import { markets, marketPriceHistory } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Automated Market Maker (AMM) Job
 * 
 * Purpose:
 * 1. Simulate liquidity for new or quiet markets.
 * 2. Maintain "lively" look for the platform by fluctuating odds and volume.
 * 3. Seed initial funds for Nexus local markets.
 */
export async function marketMakerJob() {
  console.log("[Job] Running Market Maker synchronization...");
  const db = await getDb();
  if (!db) return;

  try {
    // 1. Fetch all OPEN markets
    const openMarkets = await db
      .select()
      .from(markets)
      .where(eq(markets.status, "OPEN"));

    console.log(`[Job] Market Maker processing ${openMarkets.length} markets...`);

    for (const market of openMarkets) {
      // Logic for simulating activity:
      // - If totalPool is 0, seed it with a baseline (e.g., $1000 - $5000)
      // - Increment volume24h by a random amount (e.g., $50 - $500)
      // - Fluctuate odds by 0.5% - 2%
      
      let totalPool = market.totalPool || 0;
      let volume24h = market.volume24h || 0;
      let participants = market.participants || 0;
      let yesPool = market.yesPool || 0;
      let noPool = market.noPool || 0;

      // Initial Seeding
      if (totalPool < 100) {
        totalPool = 1000 + Math.random() * 2000;
        volume24h = 50 + Math.random() * 150;
        participants = 5 + Math.floor(Math.random() * 10);
        
        // Use existing odds or 50/50 to set initial pools
        const yOdds = market.yesOdds || 50;
        yesPool = (totalPool * yOdds) / 100;
        noPool = totalPool - yesPool;
      } else {
        // Normal Activity Simulation
        const activityMultiplier = market.isTrending ? 2.5 : 1.0;
        const newVolume = (10 + Math.random() * 90) * activityMultiplier;
        
        volume24h += newVolume;
        totalPool += newVolume;
        
        if (Math.random() > 0.7) {
          participants += 1;
        }

        // Random trade direction
        const buyYes = Math.random() > 0.5;
        if (buyYes) {
          yesPool += newVolume;
        } else {
          noPool += newVolume;
        }
      }

      // Re-calculate Odds based on new pooled amounts
      const newTotal = yesPool + noPool;
      const newYesOdds = Math.round((yesPool / newTotal) * 100);
      const newNoOdds = 100 - newYesOdds;

      // Update Database
      await db
        .update(markets)
        .set({
          totalPool: Math.round(newTotal),
          yesPool: Math.round(yesPool),
          noPool: Math.round(noPool),
          volume24h: Math.round(volume24h),
          participants,
          yesOdds: newYesOdds,
          noOdds: newNoOdds,
          updatedAt: new Date().toISOString(),
          contractAddress: (market as any).contractAddress || "0x0000000000000000000000000000000000000000" // Mock for now
        })
        .where(eq(markets.id, market.id));

      // 4. Record Price History Snapshot
      await db.insert(marketPriceHistory).values({
        marketId: String(market.id),
        priceYes: Number((yesPool / newTotal).toFixed(4)),
        priceNo: Number((noPool / newTotal).toFixed(4)),
        totalPool: Math.round(newTotal),
        timestamp: Math.floor(Date.now() / 1000),
      });
    }

    console.log("[Job] Market Maker activity simulation completed.");
  } catch (error) {
    console.error("❌ Market Maker failed:", error);
  }
}

/**
 * CLI Entry point
 */
if (process.argv[1]?.includes('marketMaker.ts')) {
  marketMakerJob()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
