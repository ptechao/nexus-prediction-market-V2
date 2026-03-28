import { translateText } from "../server/translation";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Testing translation...");
  try {
    const result = await translateText("Will Bitcoin reach $100k by 2025?", "zh-TW");
    console.log("Result:", result);
  } catch (error) {
    console.error("Test failed:", error);
  }
  process.exit(0);
}

main();
