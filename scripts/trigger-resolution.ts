import { syncMarketResolutions } from "../server/jobs/resolution-sync";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("=== Nexus Resolution Sync Trigger ===");
  try {
    await syncMarketResolutions();
    console.log("=== Sync Process Finished ===");
    process.exit(0);
  } catch (error) {
    console.error("Fatal error during sync:", error);
    process.exit(1);
  }
}

main();
