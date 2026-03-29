import "dotenv/config";
import { getDb } from "../db";
import { markets } from "../../drizzle/schema";
import { normalizeTitle } from "../_core/stringUtils";
import { inArray, eq } from "drizzle-orm";

/**
 * Script to clean up existing duplicate markets.
 * Strategy:
 * 1. Find markets with the same normalized title AND ending within the same 24h window.
 * 2. Keep the one with the highest totalPool.
 * 3. Delete the rest.
 */
async function cleanupDuplicates() {
  console.log("Starting duplicate market cleanup...");
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed.");
    return;
  }

  try {
    const allMarkets = await db.select().from(markets);
    console.log(`Analyzing ${allMarkets.length} markets...`);

    const groups: Record<string, typeof allMarkets> = {};

    for (const m of allMarkets) {
      const normTitle = normalizeTitle(m.title);
      // Group by title + date (truncated to day)
      const dateKey = m.endTime ? m.endTime.split("T")[0] : "no-date";
      const key = `${normTitle}_${dateKey}`;

      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }

    const idsToDelete: number[] = [];
    let keptCount = 0;
    let duplicateCount = 0;

    for (const key in groups) {
      const group = groups[key];
      if (group.length > 1) {
        // Sort by volume (desc), then ID (asc) to be stable
        group.sort((a, b) => {
          if ((b.totalPool || 0) !== (a.totalPool || 0)) {
            return (b.totalPool || 0) - (a.totalPool || 0);
          }
          return a.id - b.id;
        });

        const [keep, ...duplicates] = group;
        keptCount++;
        duplicateCount += duplicates.length;

        duplicates.forEach(d => idsToDelete.push(d.id));
        console.log(`[Duplicate Group] Keeping: "${keep.title}" (ID: ${keep.id}, Vol: ${keep.totalPool}), removing ${duplicates.length} others.`);
      } else {
        keptCount++;
      }
    }

    if (idsToDelete.length > 0) {
      console.log(`Deleting ${idsToDelete.length} duplicates...`);
      // Process in batches if there are many
      const batchSize = 100;
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        await db.delete(markets).where(inArray(markets.id, batch));
      }
      console.log("Cleanup complete!");
    } else {
      console.log("No duplicates found.");
    }

    console.log(`Summary: Total: ${allMarkets.length}, Kept: ${keptCount}, Deleted: ${duplicateCount}`);

  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}

cleanupDuplicates()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
