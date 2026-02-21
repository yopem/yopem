ALTER TABLE "user_settings" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "preferences" jsonb;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "api_keys" jsonb;
