import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof createClient> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      if (!_client) {
        const url = process.env.DATABASE_URL;
        const authToken = process.env.DATABASE_AUTH_TOKEN;

        console.log(`[Database] Initializing LibSQL (${url.startsWith("file:") ? "Local" : "Remote"}) connection...`);
        
        _client = createClient({
          url: url.startsWith("file:") ? "file:" + url.slice(5) : url,
          authToken: authToken,
        });
      }
      _db = drizzle(_client);
      
      // SELF-HEALING: Ensure the "orders" table has the new columns if push/migrate failed
      await ensureOrdersSchema(_client);

    } catch (error) {
      console.warn("[Database] Failed to connect or initialize:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Migration safeguard: Manually add columns if they are missing.
 * This handles drift in production environments where drizzle-kit push might fail.
 */
async function ensureOrdersSchema(client: any) {
  try {
    const columnsToAdd = [
      { name: "signature", type: "TEXT" },
      { name: "nonce", type: "INTEGER" },
      { name: "expiry", type: "INTEGER" }
    ];

    for (const col of columnsToAdd) {
      try {
        // SQLite/LibSQL syntax to add column if not exists is just ALTER TABLE
        // We wrap in a try-catch because if it exists, it will throw an error
        await client.execute(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
        console.log(`[Database] Self-healing: Added missing column '${col.name}' to 'orders' table.`);
      } catch (err: any) {
        if (err.message?.includes("duplicate column name") || err.message?.includes("already exists")) {
          // Column already exists, ignore
          continue;
        }
        console.warn(`[Database] Safeguard warning for column '${col.name}':`, err.message);
      }
    }
  } catch (error: any) {
    console.warn("[Database] Schema self-healing skipped or failed:", error.message);
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb() as any;
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: any = {
      openId: user.openId,
    };
    const updateSet: Record<string, any> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date().toISOString();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date().toISOString();
    }

    // LibSQL / SQLite uses onConflictDoUpdate
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const { eq } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId));
  return result.length > 0 ? result[0] : undefined;
}
