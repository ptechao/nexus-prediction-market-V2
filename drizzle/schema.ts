import {
  integer,
  text,
  sqliteTable,
  real,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastSignedIn: text("lastSignedIn").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Markets table - stores prediction markets from multiple sources
 */
export const markets = sqliteTable("markets", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  sourceId: text("sourceId").notNull().unique(),
  source: text("source", { enum: ["polymarket", "api-football", "world-cup", "kalshi", "predictit", "manifold"] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  eventType: text("eventType"),
  startTime: text("startTime"),
  endTime: text("endTime").notNull(),
  image: text("image"),
  tags: text("tags", { mode: 'json' }).$type<string[]>().default('[]'),
  yesOdds: real("yesOdds"),
  noOdds: real("noOdds"),
  status: text("status", { enum: [
    "OPEN",
    "RESOLVED",
    "CANCELLED",
    "DISPUTE_PENDING",
    "DISPUTE_RESOLVED",
  ] })
    .default("OPEN")
    .notNull(),
  outcome: text("outcome", { enum: ["YES", "NO", "DRAW", "INVALID"] }),
  disputeStartedAt: text("disputeStartedAt"),
  disputeEndsAt: text("disputeEndsAt"),
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
  status: text("status", { enum: ["OPEN", "RESOLVED", "REJECTED"] }).default("OPEN").notNull(),
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
  type: text("type", { enum: ["PLATFORM", "KOL", "REFUND"] }).notNull(),
  amount: real("amount").notNull(),
  status: text("status", { enum: ["PENDING", "PAID", "CANCELLED"] }).default("PENDING").notNull(),
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
  status: text("status", { enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"] })
    .default("PENDING")
    .notNull(),
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
  outcome: text("outcome", { enum: ["YES", "NO", "DRAW", "INVALID"] }).notNull(),
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
  status: text("status", { enum: ["ACTIVE", "INACTIVE", "WITHDRAWN"] }).default("ACTIVE").notNull(),
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
  side: text("side", { enum: ["YES", "NO"] }).notNull(),
  leaderAmount: real("leaderAmount").notNull(),
  followerAllocation: real("followerAllocation").notNull(),
  entryOdds: real("entryOdds"),
  exitOdds: real("exitOdds"),
  realizedPnl: real("realizedPnl"),
  status: text("status", { enum: ["QUEUED", "EXECUTED", "RESOLVED", "CANCELLED"] })
    .default("QUEUED")
    .notNull(),
  txHash: text("txHash"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});
