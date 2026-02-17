ALTER TABLE "polar_payments" ALTER COLUMN "polar_customer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_credits" ADD COLUMN "auto_topup_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_credits" ADD COLUMN "auto_topup_threshold" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "user_credits" ADD COLUMN "auto_topup_amount" numeric(10, 2);