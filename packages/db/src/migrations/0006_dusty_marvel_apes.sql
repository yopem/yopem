ALTER TABLE "categories" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;