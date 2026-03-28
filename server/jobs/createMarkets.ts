import "dotenv/config";
import { getDb } from "../db";
import { markets } from "../../drizzle/schema";
import { fetchTopMarkets, fetchMarketsByTag } from "../polymarket";
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
      .where(eq(markets.sourceId, String(seed.sourceId)))
      .limit(1);

    if (existing.length > 0) {
      if (!dryRun) {
        // Update existing market odds to ensure events sync consistently
        await db.update(markets)
          .set({
            yesOdds: seed.yesOdds !== undefined ? seed.yesOdds : existing[0].yesOdds,
            noOdds: seed.noOdds !== undefined ? seed.noOdds : existing[0].noOdds,
            totalPool: seed.totalPool !== undefined ? seed.totalPool : existing[0].totalPool,
            volume24h: seed.volume24h !== undefined ? seed.volume24h : existing[0].volume24h,
            participants: seed.participants !== undefined ? seed.participants : existing[0].participants,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(markets.id, existing[0].id));
      }
      // Count as skipped creation since it existed
      skipped++;
      continue;
    }

    if (!dryRun) {
      await db.insert(markets).values({
        sourceId: String(seed.sourceId),
        source: seed.source as any,
        title: seed.title,
        description: seed.description,
        category: seed.category,
        eventType: seed.eventType,
        startTime: seed.startTime ? new Date(seed.startTime).toISOString() : null,
        endTime: new Date(seed.endTime).toISOString(),
        image: seed.image,
        tags: seed.tags || [],
        yesOdds: seed.yesOdds !== undefined ? seed.yesOdds : 50.00,
        noOdds: seed.noOdds !== undefined ? seed.noOdds : 50.00,
        totalPool: seed.totalPool !== undefined ? seed.totalPool : 0,
        yesPool: seed.totalPool !== undefined ? (seed.totalPool * (seed.yesOdds || 50) / 100) : 0,
        noPool: seed.totalPool !== undefined ? (seed.totalPool * (seed.noOdds || 50) / 100) : 0,
        volume24h: seed.volume24h !== undefined ? seed.volume24h : 0,
        participants: seed.participants !== undefined ? seed.participants : 0,
        status: "OPEN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

    // 1. Polymarket - General Top
    console.log("\n📊 Fetching Polymarket events (Top 100)...");
    const polymarketMarkets = await fetchTopMarkets(100);
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
      noOdds: m.noOdds,
      totalPool: m.totalPool,
      volume24h: m.volume24h,
      participants: m.participants
    }));
    const pmRes = await processMarketSeeds(db, pmSeeds, "Polymarket-Top", dryRun);
    totalCreated += pmRes.created;
    totalSkipped += pmRes.skipped;

    // 1b. Polymarket - Categorized Tags
    const tagsToFetch = ["crypto", "entertainment", "politics", "elections", "basketball", "nba", "economy"];
    console.log(`📊 Fetching Polymarket specific tags: ${tagsToFetch.join(", ")}...`);
    for (const tag of tagsToFetch) {
      try {
        const taggedMarkets = await fetchMarketsByTag(tag, 20);
        const taggedSeeds: GenericMarketSeed[] = taggedMarkets.map(m => ({
          source: "polymarket",
          sourceId: m.id,
          title: m.title,
          description: m.description,
          category: m.category,
          eventType: m.eventType,
          startTime: new Date().toISOString(),
          endTime: m.endDate,
          image: m.image || undefined,
          tags: [m.category, tag, "Polymarket"],
          yesOdds: m.yesOdds,
          noOdds: m.noOdds,
          totalPool: m.totalPool,
          volume24h: m.volume24h,
          participants: m.participants
        }));
        const tRes = await processMarketSeeds(db, taggedSeeds, `Polymarket-${tag}`, dryRun);
        totalCreated += tRes.created;
        totalSkipped += tRes.skipped;
      } catch (e) {
        console.warn(`  ⚠️ Failed to fetch Polymarket tag: ${tag}`);
      }
    }

    // 2. Kalshi
    console.log("\n📊 Fetching Kalshi events (Top 50)...");
    const kalshiSeeds = await fetchKalshiMarkets(); // Currently limited inside to 20, let's just use it
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
    console.log("\n📊 Fetching Manifold Markets (Top 50)...");
    const manifoldSeeds = await fetchManifoldMarkets();
    const maniRes = await processMarketSeeds(db, manifoldSeeds, "Manifold", dryRun);
    totalCreated += maniRes.created;
    totalSkipped += maniRes.skipped;

    // 5. API-Football
    console.log("\n⚽ Fetching API-Football matches...");
    try {
      const footballMatches = await fetchUpcomingMatches(leagueId, 7, mockMode);
      const footballSeeds: GenericMarketSeed[] = footballMatches.map(convertToMarketSeed).map(s => ({
        ...s,
        source: "api-football"
      }));
      const fbRes = await processMarketSeeds(db, footballSeeds, "Football", dryRun);
      totalCreated += fbRes.created;
      totalSkipped += fbRes.skipped;
    } catch (err) {
      console.warn("  ⚠️ API-Football fetch failed, generating world cup mock samples instead.");
      const mockWcSeeds: GenericMarketSeed[] = [
        {
          source: "world-cup",
          sourceId: "wc-mock-final-2026",
          title: "World Cup 2026 Final: Brazil vs France",
          description: "Who will lift the trophy at the MetLife Stadium? Brazil seeks their 6th star against the defending finalists France.",
          category: "World Cup",
          eventType: "sports",
          startTime: "2026-07-19T20:00:00Z",
          endTime: "2026-07-19T23:00:00Z",
          image: "https://images.unsplash.com/photo-1574629810360-70f90dec40c4?q=80&w=800&auto=format",
          tags: ["World Cup", "Soccer", "Final"],
          yesOdds: 52,
          noOdds: 48
        },
        {
          source: "world-cup",
          sourceId: "wc-mock-semi-1",
          title: "World Cup Semi-Final: Argentina vs Portugal",
          description: "The dream match. Messi vs Ronaldo on the biggest stage one last time?",
          category: "World Cup",
          eventType: "sports",
          startTime: "2026-07-14T20:00:00Z",
          endTime: "2026-07-14T23:00:00Z",
          image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format",
          tags: ["World Cup", "Soccer", "Messi", "Ronaldo"],
          yesOdds: 50,
          noOdds: 50
        }
      ];
      const wcRes = await processMarketSeeds(db, mockWcSeeds, "WorldCupMock", dryRun);
      totalCreated += wcRes.created;
      totalSkipped += wcRes.skipped;
    }

    // 6. Run Market Maker simulation
    console.log("\n🤖 Running Market Maker stimulation...");
    const { marketMakerJob } = await import("./marketMaker");
    await marketMakerJob();

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
