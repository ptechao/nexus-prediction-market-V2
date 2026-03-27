import "dotenv/config";
import { getDb } from "../db";
import { markets } from "../../drizzle/schema";
import { fetchTopMarkets } from "../polymarket";
import { fetchUpcomingMatches, convertToMarketSeed } from "../services/sources/apiFootball";
import { 
  fetchKalshiMarkets, 
  fetchPredictItMarkets, 
  fetchManifoldMarkets,
  type GenericMarketSeed
} from "../services/sources/externalMarkets";
import { eq } from "drizzle-orm";

interface CreateMarketJobOptions {
  mockMode?: boolean;
  dryRun?: boolean;
  leagueId?: number;
}

/**
 * Helper to process and insert market seeds
 */
async function processMarketSeeds(db: any, seeds: GenericMarketSeed[], sourceName: string, dryRun: boolean) {
  let created = 0;
  let skipped = 0;

  for (const seed of seeds) {
    const existing = await db
      .select()
      .from(markets)
      .where(eq(markets.sourceId, seed.sourceId))
      .limit(1);

    if (existing.length > 0) {
      if (!dryRun) {
        // Update existing market odds to ensure events sync consistently
        await db.update(markets)
          .set({
            yesOdds: seed.yesOdds !== undefined ? String(seed.yesOdds) : existing[0].yesOdds,
            noOdds: seed.noOdds !== undefined ? String(seed.noOdds) : existing[0].noOdds,
            updatedAt: new Date(),
          })
          .where(eq(markets.id, existing[0].id));
      }
      // Count as skipped creation since it existed
      skipped++;
      continue;
    }

    if (!dryRun) {
      await db.insert(markets).values({
        sourceId: seed.sourceId,
        source: seed.source as any,
        title: seed.title,
        description: seed.description,
        category: seed.category,
        eventType: seed.eventType,
        startTime: new Date(seed.startTime),
        endTime: new Date(seed.endTime),
        image: seed.image,
        tags: seed.tags || [],
        yesOdds: seed.yesOdds !== undefined ? String(seed.yesOdds) : "50.00",
        noOdds: seed.noOdds !== undefined ? String(seed.noOdds) : "50.00",
        status: "OPEN",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`  ✅ Created ${sourceName}: ${seed.title.slice(0, 50)}...`);
      created++;
    } else {
      console.log(`  [DRY RUN] Would create ${sourceName}: ${seed.title.slice(0, 50)}...`);
      created++;
    }
  }

  return { created, skipped };
}

/**
 * Main job: create markets from all sources
 */
export async function createMarketsJob(options: CreateMarketJobOptions = {}) {
  const { mockMode = false, dryRun = false, leagueId = 39 } = options;

  console.log(`[${new Date().toISOString()}] Starting COMPREHENSIVE market creation job...`);
  
  try {
    const db = await getDb();
    if (!db) {
      console.warn("Database connection unavailable. Skipping market creation.");
      return { createdCount: 0, skippedCount: 0 };
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    // 1. Polymarket
    console.log("\n📊 Fetching Polymarket events...");
    const polymarketMarkets = await fetchTopMarkets();
    const pmSeeds: GenericMarketSeed[] = polymarketMarkets.map(m => ({
      source: "polymarket",
      sourceId: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      eventType: m.eventType,
      startTime: new Date().toISOString(),
      endTime: m.endDate,
      image: m.image || undefined,
      tags: [m.category, "Polymarket"],
      yesOdds: m.yesOdds,
      noOdds: m.noOdds
    }));
    const pmRes = await processMarketSeeds(db, pmSeeds, "Polymarket", dryRun);
    totalCreated += pmRes.created;
    totalSkipped += pmRes.skipped;

    // 2. Kalshi
    console.log("\n📊 Fetching Kalshi events...");
    const kalshiSeeds = await fetchKalshiMarkets();
    const kalshiRes = await processMarketSeeds(db, kalshiSeeds, "Kalshi", dryRun);
    totalCreated += kalshiRes.created;
    totalSkipped += kalshiRes.skipped;

    // 3. PredictIt
    console.log("\n📊 Fetching PredictIt events...");
    const predictItSeeds = await fetchPredictItMarkets();
    const piRes = await processMarketSeeds(db, predictItSeeds, "PredictIt", dryRun);
    totalCreated += piRes.created;
    totalSkipped += piRes.skipped;

    // 4. Manifold Markets
    console.log("\n📊 Fetching Manifold Markets events...");
    const manifoldSeeds = await fetchManifoldMarkets();
    const maniRes = await processMarketSeeds(db, manifoldSeeds, "Manifold", dryRun);
    totalCreated += maniRes.created;
    totalSkipped += maniRes.skipped;

    // 5. API-Football
    console.log("\n⚽ Fetching API-Football matches...");
    const footballMatches = await fetchUpcomingMatches(leagueId, 7, mockMode);
    const footballSeeds: GenericMarketSeed[] = footballMatches.map(convertToMarketSeed).map(s => ({
      ...s,
      source: "api-football"
    }));
    const fbRes = await processMarketSeeds(db, footballSeeds, "Football", dryRun);
    totalCreated += fbRes.created;
    totalSkipped += fbRes.skipped;

    console.log(`\n📈 Job Summary:`);
    console.log(`  Created: ${totalCreated}`);
    console.log(`  Skipped: ${totalSkipped}`);
    console.log(`  Total: ${totalCreated + totalSkipped}`);

    return { createdCount: totalCreated, skippedCount: totalSkipped };
  } catch (error) {
    console.error("❌ Error in market creation job:", error);
    throw error;
  }
}

/**
 * CLI entry point
 */
const isMain = process.argv[1]?.includes('createMarkets.ts') || 
               (typeof import.meta.url === 'string' && process.argv[1]?.includes(new URL(import.meta.url).pathname));

if (isMain) {
  const args = process.argv.slice(2);
  const options: CreateMarketJobOptions = {
    mockMode: args.includes("--mock"),
    dryRun: args.includes("--dry-run"),
    leagueId: parseInt(args.find((a) => a.startsWith("--league="))?.split("=")[1] || "39"),
  };

  createMarketsJob(options)
    .then(() => {
      console.log("\n✅ Job completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Job failed:", error);
      process.exit(1);
    });
}

export default createMarketsJob;
