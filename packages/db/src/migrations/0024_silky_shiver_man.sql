ALTER TABLE "subscriptions" ALTER COLUMN "source" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "source" SET DEFAULT 'polar'::text;--> statement-breakpoint
DROP TYPE "public"."subscription_source";--> statement-breakpoint
CREATE TYPE "public"."subscription_source" AS ENUM('polar');--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "source" SET DEFAULT 'polar'::"public"."subscription_source";--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "source" SET DATA TYPE "public"."subscription_source" USING "source"::"public"."subscription_source";--> statement-breakpoint
CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_polar_subscription_id" ON "subscriptions" USING btree ("polar_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_polar_customer_id" ON "subscriptions" USING btree ("polar_customer_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_tier" ON "subscriptions" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_current_period_end" ON "subscriptions" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_created_at" ON "subscriptions" USING btree ("created_at");