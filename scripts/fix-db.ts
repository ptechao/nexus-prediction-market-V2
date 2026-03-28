import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "nexus.sqlite";
const url = "file:" + (connectionString.startsWith("file:") ? connectionString.slice(5) : connectionString);

async function main() {
  console.log(`Connecting to ${url}...`);
  const client = createClient({ url });

  try {
    console.log("Adding contractAddress column to markets table...");
    await client.execute("ALTER TABLE markets ADD COLUMN contractAddress TEXT");
    console.log("✅ Column added successfully.");
  } catch (error) {
    if (error.message.includes("duplicate column name")) {
      console.log("ℹ️ Column already exists.");
    } else {
      console.error("❌ Failed to add column:", error);
    }
  }

  process.exit(0);
}

main();
