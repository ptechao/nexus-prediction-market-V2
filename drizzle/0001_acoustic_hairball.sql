CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`marketId` integer NOT NULL,
	`orderIdOnChain` integer,
	`maker` text NOT NULL,
	`amount` real NOT NULL,
	`price` real NOT NULL,
	`isYes` integer NOT NULL,
	`isBuying` integer NOT NULL,
	`remaining` real NOT NULL,
	`status` text DEFAULT 'OPEN',
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
