ALTER TABLE "products" RENAME COLUMN "cost_per_run" TO "credits_per_run";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "credits_per_run" TYPE integer USING (credits_per_run::integer);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "credits_per_run" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "credits_per_run" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "markup";
