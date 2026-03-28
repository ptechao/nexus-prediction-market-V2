import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const c = createClient({ url: 'file:sqlite.db' });
  const r = await c.execute("SELECT source, category, count(*) as count FROM markets GROUP BY source, category");
  console.log(JSON.stringify(r.rows, null, 2));
}

main();
