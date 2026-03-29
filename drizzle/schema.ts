import {
  integer,
  text,
  sqliteTable,
  real,
} from "drizzle-orm/sqlite-core";
import { sql, type SQL } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP` as unknown as SQL).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP` as unknown as SQL).notNull(),
  lastSignedIn: text("lastSignedIn").default(sql`CURRENT_TIMESTAMP` as unknown as SQL).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Markets table - stores prediction markets from multiple sources
 */
export const markets = sqliteTable("markets", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  sourceId: text("sourceId").notNull().unique(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  eventType: text("eventType"),
  startTime: text("startTime"),
  endTime: text("endTime").notNull(),
  image: text("image"),
  tags: text("tags", { mode: 'json' }).$type<string[]>().default([]),
  yesOdds: real("yesOdds"),
  noOdds: real("noOdds"),
  totalPool: real("totalPool").default(0),
  yesPool: real("yesPool").default(0),
  noPool: real("noPool").default(0),
  volume24h: real("volume24h").default(0),
  participants: integer("participants", { mode: 'number' }).default(0),
  status: text("status").default("OPEN").notNull(),
  outcome: text("outcome"),
  disputeStartedAt: text("disputeStartedAt"),
  disputeEndsAt: text("disputeEndsAt"),
  contractAddress: text("contractAddress"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Market = typeof markets.$inferSelect;
export type InsertMarket = typeof markets.$inferInsert;

/**
 * Disputes table
 */
export const disputes = sqliteTable("disputes", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  marketId: integer("marketId").notNull(),
  initiatedBy: integer("initiatedBy").notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("OPEN").notNull(),
  resolvedBy: integer("resolvedBy"),
  resolution: text("resolution"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * Fee ledger
 */
export const fees = sqliteTable("fees", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  marketId: integer("marketId").notNull(),
  traderId: integer("traderId"),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  status: text("status").default("PENDING").notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * Refunds table
 */
export const refunds = sqliteTable("refunds", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  marketId: integer("marketId").notNull(),
  userId: integer("userId").notNull(),
  amount: real("amount").notNull(),
  status: text("status").default("PENDING").notNull(),
  reason: text("reason"),
  txHash: text("txHash"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * Market outcomes
 */
export const marketOutcomes = sqliteTable("marketOutcomes", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  marketId: integer("marketId").notNull().unique(),
  outcome: text("outcome").notNull(),
  source: text("source"),
  confidence: real("confidence"),
  notes: text("notes"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * Followers Vaults
 */
export const followersVaults = sqliteTable("followersVaults", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  followerId: integer("followerId").notNull(),
  traderId: integer("traderId").notNull(),
  vaultAddress: text("vaultAddress").notNull(),
  depositAmount: real("depositAmount").notNull(),
  sharesMinted: real("sharesMinted").notNull(),
  status: text("status").default("ACTIVE").notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * Follower Trades
 */
export const followerTrades = sqliteTable("followerTrades", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  followerId: integer("followerId").notNull(),
  traderId: integer("traderId").notNull(),
  marketId: integer("marketId").notNull(),
  side: text("side").notNull(),
  leaderAmount: real("leaderAmount").notNull(),
  followerAllocation: real("followerAllocation").notNull(),
  entryOdds: real("entryOdds"),
  exitOdds: real("exitOdds"),
  realizedPnl: real("realizedPnl"),
  status: text("status").default("QUEUED").notNull(),
  txHash: text("txHash"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Table to track real price movements for K-lines/charts
export const marketPriceHistory = sqliteTable("market_price_history", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  marketId: text("market_id").notNull(),
  priceYes: real("price_yes").notNull(),
  priceNo: real("price_no").notNull(),
  totalPool: integer("total_pool", { mode: 'number' }).notNull(),
  timestamp: integer("timestamp", { mode: 'number' }).notNull(),
});

/**
 * Limit Orders for the Order Book
 */
export const orders = sqliteTable("orders", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  marketId: integer("marketId", { mode: 'number' }).notNull(),
  maker: text("maker").notNull(),
  amount: real("amount").notNull(),
  price: real("price").notNull(),
  isYes: integer("isYes", { mode: 'boolean' }).notNull(),
  isBuying: integer("isBuying", { mode: 'boolean' }).notNull(),
  remaining: real("remaining").notNull(),
  signature: text("signature"),
  nonce: integer("nonce", { mode: 'number' }),
  expiry: integer("expiry", { mode: 'number' }),
  status: text("status").default("OPEN"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP` as unknown as SQL).notNull(),
});
