CREATE TABLE `chatHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`farmId` int,
	`userMessage` text NOT NULL,
	`assistantMessage` text NOT NULL,
	`context` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `climateAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`farmId` int,
	`alertType` enum('drought','flood','pest','rainfall','temperature','wind') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`recommendation` text,
	`source` varchar(100),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `climateAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diseaseDetections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`farmId` int,
	`crop` varchar(100) NOT NULL,
	`disease` varchar(255) NOT NULL,
	`confidence` decimal(5,2) NOT NULL,
	`imageUrl` text,
	`treatment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diseaseDetections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `educationalContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`contentType` enum('article','video','calendar','guide') NOT NULL,
	`contentUrl` text,
	`language` enum('en','sw') NOT NULL DEFAULT 'en',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `educationalContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `farms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`farmName` varchar(255) NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`areaHectares` decimal(8,2),
	`primaryCrop` varchar(100),
	`soilType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketPrices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`crop` varchar(100) NOT NULL,
	`market` varchar(255) NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`price` decimal(10,2) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`date` timestamp NOT NULL,
	`source` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketPrices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phoneNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `language` enum('en','sw') DEFAULT 'en' NOT NULL;