CREATE TABLE `advisoryContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countryCode` varchar(2),
	`cropCode` varchar(10),
	`advisoryType` enum('planting','harvesting','fertilizer','pest_control','irrigation','general') NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`language` enum('en','sw','am','ar','so') NOT NULL DEFAULT 'en',
	`season` varchar(50),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advisoryContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agricultureWatch` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`summary` text NOT NULL,
	`cropConditions` json NOT NULL,
	`rangelandConditions` json NOT NULL,
	`rainfallAnomalies` json,
	`soilMoisture` json,
	`vegetationIndex` json,
	`source` varchar(50) NOT NULL DEFAULT 'ICPAC',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agricultureWatch_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `climateData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countryCode` varchar(2) NOT NULL,
	`regionCode` varchar(10),
	`date` timestamp NOT NULL,
	`temperatureMin` decimal(5,2),
	`temperatureMax` decimal(5,2),
	`temperatureAvg` decimal(5,2),
	`rainfall` decimal(8,2),
	`humidity` decimal(5,2),
	`windSpeed` decimal(5,2),
	`soilMoisture` decimal(5,2),
	`source` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `climateData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(2) NOT NULL,
	`name` varchar(100) NOT NULL,
	`iso3` varchar(3) NOT NULL,
	`faoCode` varchar(10),
	`currency` varchar(3) NOT NULL,
	`flag` varchar(5),
	`igadMember` boolean NOT NULL DEFAULT true,
	`capitalLatitude` decimal(10,7),
	`capitalLongitude` decimal(11,7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `countries_id` PRIMARY KEY(`id`),
	CONSTRAINT `countries_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `crops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`scientificName` varchar(100),
	`category` varchar(50) NOT NULL,
	`faostatCode` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crops_id` PRIMARY KEY(`id`),
	CONSTRAINT `crops_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `hazardAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertType` enum('drought','flood','pest','rainfall','extreme_rainfall','locust') NOT NULL,
	`severity` enum('low','moderate','high','extreme') NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`affectedCountries` json NOT NULL,
	`affectedRegions` json,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`source` varchar(50) NOT NULL DEFAULT 'ICPAC',
	`advisory` text,
	`mitigationMeasures` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hazardAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countryCode` varchar(2) NOT NULL,
	`regionCode` varchar(10),
	`name` varchar(100) NOT NULL,
	`latitude` decimal(10,7),
	`longitude` decimal(11,7),
	`marketType` varchar(50) DEFAULT 'wholesale',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `markets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countryCode` varchar(2) NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`latitude` decimal(10,7),
	`longitude` decimal(11,7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smsLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`phoneNumber` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`direction` enum('in','out') NOT NULL,
	`status` enum('sent','delivered','failed','read','pending') NOT NULL,
	`gateway` varchar(50),
	`gatewayMessageId` varchar(100),
	`cost` decimal(10,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `smsLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ussdSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`network` varchar(50),
	`currentMenu` varchar(100),
	`menuHistory` json,
	`userInput` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ussdSessions_id` PRIMARY KEY(`id`)
);
