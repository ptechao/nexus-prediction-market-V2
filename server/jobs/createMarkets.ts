#!/usr/bin/env tsx
// Market Creation Cron Job
// Scans upcoming events from Polymarket and API-Football, creates markets in DB

import { db } from "../db";
import { markets } from "../../drizzle/schema";
import { fetchTopMarkets } from "../polymarket";
import { fetchUpcomingMatches, convertToMarketSeed } from "../services/sources/apiFootball";
import { eq } from "drizzle-orm";

interface CreateMarketJobOptions {
  mockMode?: boolean;
  dryRun?: boolean;
  leagueId?: number;
}

/**
 * Main job: create markets from both sources
 */
export async function createMarketsJob(options: CreateMarketJobOptions = {}) {
  const { mockMode = false, dryRun = false, leagueId = 39 } = options;

  console.log(`[${new Date().toISOString()}] Starting market creation job...`);
  console.log(`  Mock mode: ${mockMode}`);
  console.log(`  Dry run: ${dryRun}`);

  try {
    // Fetch from Polymarket
    console.log("\n📊 Fetching Polymarket events...");
    const polymarketMarkets = await fetchTopMarkets();
    console.log(`  Found ${polymarketMarkets.length} Polymarket events`);

    // Fetch from API-Football
    console.log("\n⚽ Fetching API-Football matches...");
    const footballMatches = await fetchUpcomingMatches(leagueId, 7, mockMode);
    console.log(`  Found ${footballMatches.length} upcoming football matches`);

    // Convert to market seeds
    const footballSeeds = footballMatches.map(convertToMarketSeed);

    // Create markets
    let createdCount = 0;
    let skippedCount = 0;

    // Process Polymarket markets
    for (const market of polymarketMarkets) {
      const existing = await db
        .select()
        .from(markets)
        .where(eq(markets.sourceId, market.id))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  ⏭️  Skipping existing market: ${market.title}`);
        skippedCount++;
        continue;
      }

      if (!dryRun) {
        await db.insert(markets).values({
          sourceId: market.id,
          source: "polymarket",
          title: market.title,
          description: market.description,
          category: market.category,
          eventType: market.eventType,
          startTime: new Date(market.endDate),
          endTime: new Date(market.endDate),
          image: market.image,
          tags: market.tags || [],
          yesOdds: market.yesOdds,
          noOdds: market.noOdds,
          status: "OPEN",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`  ✅ Created Polymarket: ${market.title}`);
        createdCount++;
      } else {
        console.log(`  [DRY RUN] Would create Polymarket: ${market.title}`);
        createdCount++;
      }
    }

    // Process API-Football markets
    for (const seed of footballSeeds) {
      const existing = await db
        .select()
        .from(markets)
        .where(eq(markets.sourceId, seed.sourceId))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  ⏭️  Skipping existing market: ${seed.title}`);
        skippedCount++;
        continue;
      }

      if (!dryRun) {
        await db.insert(markets).values({
          sourceId: seed.sourceId,
          source: "api-football",
          title: seed.title,
          description: seed.description,
          category: seed.category,
          eventType: seed.eventType,
          startTime: new Date(seed.startTime),
          endTime: new Date(seed.endTime),
          image: seed.image,
          tags: seed.tags,
          status: "OPEN",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`  ✅ Created Football: ${seed.title}`);
        createdCount++;
      } else {
        console.log(`  [DRY RUN] Would create Football: ${seed.title}`);
        createdCount++;
      }
    }

    console.log(`\n📈 Job Summary:`);
    console.log(`  Created: ${createdCount}`);
    console.log(`  Skipped: ${skippedCount}`);
    console.log(`  Total: ${createdCount + skippedCount}`);

    return { createdCount, skippedCount };
  } catch (error) {
    console.error("❌ Error in market creation job:", error);
    throw error;
  }
}

/**
 * CLI entry point
 */
if (require.main === module) {
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
