CREATE TABLE `disputes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`marketId` integer NOT NULL,
	`initiatedBy` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`resolvedBy` integer,
	`resolution` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`marketId` integer NOT NULL,
	`traderId` integer,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `followerTrades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`followerId` integer NOT NULL,
	`traderId` integer NOT NULL,
	`marketId` integer NOT NULL,
	`side` text NOT NULL,
	`leaderAmount` real NOT NULL,
	`followerAllocation` real NOT NULL,
	`entryOdds` real,
	`exitOdds` real,
	`realizedPnl` real,
	`status` text DEFAULT 'QUEUED' NOT NULL,
	`txHash` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `followersVaults` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`followerId` integer NOT NULL,
	`traderId` integer NOT NULL,
	`vaultAddress` text NOT NULL,
	`depositAmount` real NOT NULL,
	`sharesMinted` real NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `marketOutcomes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`marketId` integer NOT NULL,
	`outcome` text NOT NULL,
	`source` text,
	`confidence` real,
	`notes` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `marketOutcomes_marketId_unique` ON `marketOutcomes` (`marketId`);--> statement-breakpoint
CREATE TABLE `market_price_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`market_id` text NOT NULL,
	`price_yes` real NOT NULL,
	`price_no` real NOT NULL,
	`total_pool` integer NOT NULL,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sourceId` text NOT NULL,
	`source` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text,
	`eventType` text,
	`startTime` text,
	`endTime` text NOT NULL,
	`image` text,
	`tags` text DEFAULT '[]',
	`yesOdds` real,
	`noOdds` real,
	`totalPool` real DEFAULT 0,
	`yesPool` real DEFAULT 0,
	`noPool` real DEFAULT 0,
	`volume24h` real DEFAULT 0,
	`participants` integer DEFAULT 0,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`outcome` text,
	`disputeStartedAt` text,
	`disputeEndsAt` text,
	`contractAddress` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `markets_sourceId_unique` ON `markets` (`sourceId`);--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`marketId` integer NOT NULL,
	`userId` integer NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`reason` text,
	`txHash` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`lastSignedIn` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);