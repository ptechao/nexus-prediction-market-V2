CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketId` int NOT NULL,
	`initiatedBy` int NOT NULL,
	`reason` text NOT NULL,
	`status` enum('OPEN','RESOLVED','REJECTED') NOT NULL DEFAULT 'OPEN',
	`resolvedBy` int,
	`resolution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketId` int NOT NULL,
	`traderId` int,
	`type` enum('PLATFORM','KOL','REFUND') NOT NULL,
	`amount` decimal(18,6) NOT NULL,
	`status` enum('PENDING','PAID','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketOutcomes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketId` int NOT NULL,
	`outcome` enum('YES','NO','DRAW','INVALID') NOT NULL,
	`source` varchar(255),
	`confidence` decimal(3,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketOutcomes_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketOutcomes_marketId_unique` UNIQUE(`marketId`)
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` varchar(255) NOT NULL,
	`source` enum('polymarket','api-football','world-cup') NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` varchar(255),
	`eventType` varchar(255),
	`startTime` timestamp,
	`endTime` timestamp NOT NULL,
	`image` varchar(512),
	`tags` json DEFAULT ('[]'),
	`yesOdds` decimal(5,2),
	`noOdds` decimal(5,2),
	`status` enum('OPEN','RESOLVED','CANCELLED','DISPUTE_PENDING','DISPUTE_RESOLVED') NOT NULL DEFAULT 'OPEN',
	`outcome` enum('YES','NO','DRAW','INVALID'),
	`disputeStartedAt` timestamp,
	`disputeEndsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `markets_id` PRIMARY KEY(`id`),
	CONSTRAINT `markets_sourceId_unique` UNIQUE(`sourceId`)
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(18,6) NOT NULL,
	`status` enum('PENDING','APPROVED','REJECTED','COMPLETED') NOT NULL DEFAULT 'PENDING',
	`reason` text,
	`txHash` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`)
);
