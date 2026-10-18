CREATE TABLE `demo_credentials` (
	`user_id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`contact` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `demo_contact_unique` ON `demo_credentials` (`channel`,`contact`);