DROP TABLE "subscriptions" CASCADE;--> statement-breakpoint
DROP TABLE "user_credits" CASCADE;--> statement-breakpoint
DROP TABLE "credit_transactions" CASCADE;--> statement-breakpoint
DROP TABLE "polar_payments" CASCADE;--> statement-breakpoint
DROP TABLE "polar_payment_events" CASCADE;--> statement-breakpoint
DROP TABLE "polar_checkout_sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description_content" jsonb;--> statement-breakpoint
DROP TYPE "public"."subscription_source";--> statement-breakpoint
DROP TYPE "public"."subscription_status";--> statement-breakpoint
DROP TYPE "public"."subscription_tier";