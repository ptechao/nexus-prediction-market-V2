import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "nexus.sqlite";
const url = "file:" + (connectionString.startsWith("file:") ? connectionString.slice(5) : connectionString);

async function main() {
  const client = createClient({ url });
  try {
    const res = await client.execute("SELECT category, COUNT(*) as count FROM markets GROUP BY category");
    console.table(res.rows);
  } catch (error) {
    console.error(error);
  }
  process.exit(0);
}

main();
