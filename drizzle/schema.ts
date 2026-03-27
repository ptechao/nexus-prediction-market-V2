import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Markets table - stores prediction markets from multiple sources
 */
export const markets = mysqlTable("markets", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: varchar("sourceId", { length: 255 }).notNull().unique(),
  source: mysqlEnum("source", ["polymarket", "api-football", "world-cup", "kalshi", "predictit", "manifold"]).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 255 }),
  eventType: varchar("eventType", { length: 255 }),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime").notNull(),
  image: varchar("image", { length: 512 }),
  tags: json("tags").$type<string[]>().default([]),
  yesOdds: decimal("yesOdds", { precision: 5, scale: 2 }),
  noOdds: decimal("noOdds", { precision: 5, scale: 2 }),
  status: mysqlEnum("status", [
    "OPEN",
    "RESOLVED",
    "CANCELLED",
    "DISPUTE_PENDING",
    "DISPUTE_RESOLVED",
  ])
    .default("OPEN")
    .notNull(),
  outcome: mysqlEnum("outcome", ["YES", "NO", "DRAW", "INVALID"]),
  disputeStartedAt: timestamp("disputeStartedAt"),
  disputeEndsAt: timestamp("disputeEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Market = typeof markets.$inferSelect;
export type InsertMarket = typeof markets.$inferInsert;

/**
 * Disputes table - stores market disputes and resolutions
 */
export const disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  marketId: int("marketId").notNull(),
  initiatedBy: int("initiatedBy").notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["OPEN", "RESOLVED", "REJECTED"]).default("OPEN").notNull(),
  resolvedBy: int("resolvedBy"),
  resolution: text("resolution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

/**
 * Fee ledger - tracks platform and KOL fees
 */
export const fees = mysqlTable("fees", {
  id: int("id").autoincrement().primaryKey(),
  marketId: int("marketId").notNull(),
  traderId: int("traderId"),
  type: mysqlEnum("type", ["PLATFORM", "KOL", "REFUND"]).notNull(),
  amount: decimal("amount", { precision: 18, scale: 6 }).notNull(),
  status: mysqlEnum("status", ["PENDING", "PAID", "CANCELLED"]).default("PENDING").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Fee = typeof fees.$inferSelect;
export type InsertFee = typeof fees.$inferInsert;

/**
 * Refunds table - tracks refund requests and status
 */
export const refunds = mysqlTable("refunds", {
  id: int("id").autoincrement().primaryKey(),
  marketId: int("marketId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 18, scale: 6 }).notNull(),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED", "COMPLETED"])
    .default("PENDING")
    .notNull(),
  reason: text("reason"),
  txHash: varchar("txHash", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Refund = typeof refunds.$inferSelect;
export type InsertRefund = typeof refunds.$inferInsert;

/**
 * Market outcomes - stores actual outcomes for resolved markets
 */
export const marketOutcomes = mysqlTable("marketOutcomes", {
  id: int("id").autoincrement().primaryKey(),
  marketId: int("marketId").notNull().unique(),
  outcome: mysqlEnum("outcome", ["YES", "NO", "DRAW", "INVALID"]).notNull(),
  source: varchar("source", { length: 255 }),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketOutcome = typeof marketOutcomes.$inferSelect;
export type InsertMarketOutcome = typeof marketOutcomes.$inferInsert;

/**
 * Followers Vaults - tracks copy trading relationships and fund allocations
 */
export const followersVaults = mysqlTable("followersVaults", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  traderId: int("traderId").notNull(),
  vaultAddress: varchar("vaultAddress", { length: 255 }).notNull(),
  depositAmount: decimal("depositAmount", { precision: 18, scale: 6 }).notNull(),
  sharesMinted: decimal("sharesMinted", { precision: 18, scale: 6 }).notNull(),
  status: mysqlEnum("status", ["ACTIVE", "INACTIVE", "WITHDRAWN"]).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FollowersVault = typeof followersVaults.$inferSelect;
export type InsertFollowersVault = typeof followersVaults.$inferInsert;

/**
 * Follower Trades - tracks proportional trade allocations for followers
 */
export const followerTrades = mysqlTable("followerTrades", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  traderId: int("traderId").notNull(),
  marketId: int("marketId").notNull(),
  side: mysqlEnum("side", ["YES", "NO"]).notNull(),
  leaderAmount: decimal("leaderAmount", { precision: 18, scale: 6 }).notNull(),
  followerAllocation: decimal("followerAllocation", { precision: 18, scale: 6 }).notNull(),
  entryOdds: decimal("entryOdds", { precision: 5, scale: 2 }),
  exitOdds: decimal("exitOdds", { precision: 5, scale: 2 }),
  realizedPnl: decimal("realizedPnl", { precision: 18, scale: 6 }),
  status: mysqlEnum("status", ["QUEUED", "EXECUTED", "RESOLVED", "CANCELLED"])
    .default("QUEUED")
    .notNull(),
  txHash: varchar("txHash", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FollowerTrade = typeof followerTrades.$inferSelect;
export type InsertFollowerTrade = typeof followerTrades.$inferInsert;
