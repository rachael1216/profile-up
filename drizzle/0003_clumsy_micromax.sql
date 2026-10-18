CREATE TABLE `auth_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`browser_hash` text NOT NULL,
	`channel` text NOT NULL,
	`contact` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	`used` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `challenges_expiry` ON `auth_challenges` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `limits_expiry` ON `auth_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_user` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expiry` ON `auth_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth_users` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_subject` text NOT NULL,
	`channel` text NOT NULL,
	`contact` text NOT NULL,
	`verified_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_users_provider_subject_unique` ON `auth_users` (`provider_subject`);