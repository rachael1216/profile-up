CREATE TABLE `drafts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`document_json` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `published_sites` (
	`slug` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`document_json` text NOT NULL,
	`revision` integer NOT NULL,
	`published` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `published_sites_user_id_unique` ON `published_sites` (`user_id`);