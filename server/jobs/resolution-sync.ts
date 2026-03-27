import { getDb } from "../db";
import { markets, marketOutcomes } from "../../drizzle/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { WORLD_CUP_MATCHES } from "../data/worldcupMatches";

/**
 * Background job to synchronize market resolutions.
 * This job finds expired markets and resolve them based on actual match results.
 */
export async function syncMarketResolutions() {
  console.log("[Job] Starting market resolution synchronization...");
  const db = await getDb();
  if (!db) {
    console.warn("[Job] Database not available, skipping resolution sync.");
    return;
  }

  try {
    const now = new Date();
    
    // 1. Find all OPEN markets that have ended
    const expiredMarkets = await db
      .select()
      .from(markets)
      .where(
        and(
          eq(markets.status, "OPEN"),
          lt(markets.endTime, now)
        )
      );

    console.log(`[Job] Found ${expiredMarkets.length} expired markets.`);

    for (const market of expiredMarkets) {
      let outcome: "YES" | "NO" | "DRAW" | "INVALID" | null = null;
      let notes = "";

      // 2. Determine outcome based on source
      if (market.source === "world-cup") {
        const match = WORLD_CUP_MATCHES.find(m => m.id === market.sourceId);
        if (match && match.status === "finished") {
          // Simplistic outcome determination for demo
          // In a real app, this would check match.homeScore vs match.awayScore
          // For now, assume YES if it's a specific bet or use random for demo
          if (match.homeScore! > match.awayScore!) {
            outcome = "YES";
            notes = `Match finished: ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`;
          } else if (match.homeScore! < match.awayScore!) {
            outcome = "NO";
            notes = `Match finished: ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`;
          } else {
            outcome = "DRAW";
            notes = "Match ended in a draw.";
          }
        }
      } else if (market.source === "api-football") {
        // Here we would call external API
        // For demo purposes, we'll mark as RESOLVED with a simulated outcome
        outcome = Math.random() > 0.5 ? "YES" : "NO";
        notes = "Resolved via automated API sync (Simulated).";
      }

      // 3. Update market status and record outcome
      if (outcome) {
        console.log(`[Job] Resolving market ${market.id} (${market.title}): ${outcome}`);
        
        await db.transaction(async (tx) => {
          // Update market status
          await tx
            .update(markets)
            .set({ 
              status: "RESOLVED",
              outcome: outcome,
              updatedAt: new Date()
            })
            .where(eq(markets.id, market.id));

          // Record formal outcome
          await tx
            .insert(marketOutcomes)
            .values({
              marketId: market.id,
              outcome: outcome,
              source: "automated-sync",
              notes: notes,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .onDuplicateKeyUpdate({
              set: {
                outcome: outcome,
                notes: notes,
                updatedAt: new Date()
              }
            });
        });
      }
    }

    console.log("[Job] Market resolution synchronization completed.");
  } catch (error) {
    console.error("[Job] Resolution sync failed:", error);
  }
}
