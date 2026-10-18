CREATE INDEX `files_owner` ON `profile_files` (`owner_id`);--> statement-breakpoint
CREATE INDEX `files_profile` ON `profile_files` (`profile_id`);--> statement-breakpoint
CREATE INDEX `profiles_owner_created` ON `profiles` (`owner_id`,`created_at`);