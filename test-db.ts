import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

async function test() {
  console.log("Testing LibSQL connection...");
  const dbUrl = process.env.DATABASE_URL || "sqlite.db";
  const url = "file:" + (dbUrl.startsWith("file:") ? dbUrl.slice(5) : dbUrl);
  console.log("URL:", url);
  
  try {
    const client = createClient({ url });
    const rs = await client.execute("SELECT 1");
    console.log("Success:", rs);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
