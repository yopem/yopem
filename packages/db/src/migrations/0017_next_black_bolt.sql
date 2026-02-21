CREATE TABLE "polar_checkout_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"checkout_id" text NOT NULL,
	"product_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "polar_checkout_sessions_checkout_id_unique" UNIQUE("checkout_id")
);
--> statement-breakpoint
CREATE INDEX "idx_polar_checkout_sessions_user_id" ON "polar_checkout_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_polar_checkout_sessions_checkout_id" ON "polar_checkout_sessions" USING btree ("checkout_id");