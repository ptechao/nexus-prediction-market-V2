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
import { eq, sql } from "drizzle-orm";
import { normalizeTitle } from "../_core/stringUtils";

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
  let updated = 0;
  let skipped = 0;

  // Pre-fetch existing markets by title and end_time to catch cross-source duplicates
  // This is a heuristic: if titles are "same" (normalized) and end times are similar, skip.
  const existingMarkets = await db.select({
    id: markets.id,
    title: markets.title,
    endTime: markets.endTime,
    sourceId: markets.sourceId
  }).from(markets);

  for (const seed of seeds) {
    // Yield event loop
    await new Promise(resolve => setTimeout(resolve, 20)); 

    const normSeedTitle = normalizeTitle(seed.title);
    
    // 1. Cross-source check: Check if a similar market already exists (different ID but same title/end_time)
    const duplicateByTitle = existingMarkets.find((m: any) => 
      normalizeTitle(m.title) === normSeedTitle && 
      Math.abs(new Date(m.endTime).getTime() - new Date(seed.endTime).getTime()) < 24 * 60 * 60 * 1000 // Within 24h
    );

    if (duplicateByTitle && duplicateByTitle.sourceId !== String(seed.sourceId)) {
      // console.log(`[Sync] Skipping potential cross-source duplicate: "${seed.title}" (Matches ID: ${duplicateByTitle.sourceId})`);
      skipped++;
      continue;
    }

    if (!dryRun) {
      try {
        // Use atomic UPSERT for sourceId matching
        const values = {
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
          status: "OPEN" as const,
          updatedAt: new Date().toISOString(),
        };

        const result = await db.insert(markets)
          .values({
            ...values,
            createdAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: markets.sourceId,
            set: {
              yesOdds: values.yesOdds,
              noOdds: values.noOdds,
              totalPool: values.totalPool,
              volume24h: values.volume24h,
              participants: values.participants,
              updatedAt: values.updatedAt,
            }
          });
        
        // SQLite/LibSQL doesn't always return counts clearly in this format, but we assume success
        created++;
      } catch (err) {
        console.error(`[Sync] Failed to upsert market ${seed.sourceId}:`, err);
        skipped++;
      }
    } else {
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

  console.log(`[${new Date().toISOString()}] Starting COMPREHENSIVE sync (100 top, 20 per tag)...`);
  
  try {
    const db = await getDb();
    if (!db) {
      console.warn("Database connection unavailable. Skipping market creation.");
      return { createdCount: 0, skippedCount: 0 };
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    // 1. Polymarket - General Top
    const polymarketLimit = 100; 
    const polymarketMarkets = await fetchTopMarkets(polymarketLimit);
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

    // 2. Kalshi (Silenced source)
    const kalshiSeeds = await fetchKalshiMarkets(); 
    const kalshiRes = await processMarketSeeds(db, kalshiSeeds, "Kalshi", dryRun);
    totalCreated += kalshiRes.created;
    totalSkipped += kalshiRes.skipped;

    // 3. PredictIt (Silenced source)
    const predictItSeeds = await fetchPredictItMarkets();
    const piRes = await processMarketSeeds(db, predictItSeeds, "PredictIt", dryRun);
    totalCreated += piRes.created;
    totalSkipped += piRes.skipped;

    // 4. Manifold Markets
    const manifoldSeeds = await fetchManifoldMarkets();
    const maniRes = await processMarketSeeds(db, manifoldSeeds, "Manifold", dryRun);
    totalCreated += maniRes.created;
    totalSkipped += maniRes.skipped;

    // 5. API-Football
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
      // Logic for fallback/mock was creating stale data
      console.warn("  ⚠️ API-Football fetch failed, skipping mock fallback to prevent duplicates.");
    }

    // 6. Run Market Maker simulation
    const { marketMakerJob } = await import("./marketMaker");
    await marketMakerJob();

    console.log(`[Job] Summary - Created: ${totalCreated}, Skipped: ${totalSkipped}`);

    return { createdCount: totalCreated, skippedCount: totalSkipped };
  } catch (error) {
    console.error("❌ Job Error:", error);
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
