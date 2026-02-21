CREATE TABLE "polar_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"polar_payment_id" text NOT NULL,
	"polar_customer_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text NOT NULL,
	"product_id" text NOT NULL,
	"credits_granted" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "polar_payments_polar_payment_id_unique" UNIQUE("polar_payment_id")
);
--> statement-breakpoint
CREATE TABLE "polar_payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"polar_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "polar_payment_events_polar_event_id_unique" UNIQUE("polar_event_id")
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "polar_customer_id" text;--> statement-breakpoint
CREATE INDEX "idx_polar_payments_user_id" ON "polar_payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_polar_payments_polar_payment_id" ON "polar_payments" USING btree ("polar_payment_id");--> statement-breakpoint
CREATE INDEX "idx_polar_payment_events_polar_event_id" ON "polar_payment_events" USING btree ("polar_event_id");--> statement-breakpoint
CREATE INDEX "idx_polar_payment_events_event_type" ON "polar_payment_events" USING btree ("event_type");