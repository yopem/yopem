CREATE TYPE "public"."subscription_source" AS ENUM('polar');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'past_due', 'expired');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "ai_models" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"model_id" text NOT NULL,
	"display_name" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_models_provider_model_id_unique" UNIQUE("provider","model_id")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"bio" text,
	"avatar_url" text,
	"polar_customer_id" text,
	"preferences" jsonb,
	"api_keys" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"polar_subscription_id" text,
	"polar_customer_id" text,
	"tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"source" "subscription_source" DEFAULT 'polar' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_polar_subscription_id_unique" UNIQUE("polar_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"excerpt" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"config" jsonb,
	"system_role" text,
	"user_instruction_template" text,
	"input_variable" jsonb,
	"output_format" text DEFAULT 'plain',
	"cost_per_run" numeric(10, 4) DEFAULT '0',
	"markup" numeric(5, 4) DEFAULT '0.2000',
	"is_public" boolean DEFAULT true,
	"api_key_id" text,
	"thumbnail_id" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"version" integer NOT NULL,
	"config" jsonb,
	"system_role" text,
	"user_instruction_template" text,
	"input_variable" jsonb,
	"output_format" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_tags" (
	"product_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "product_tags_product_id_tag_id_pk" PRIMARY KEY("product_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"product_id" text NOT NULL,
	"category_id" text NOT NULL,
	CONSTRAINT "product_categories_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "product_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"user_id" text NOT NULL,
	"version_id" text,
	"inputs" jsonb,
	"outputs" jsonb,
	"status" text DEFAULT 'running' NOT NULL,
	"error_message" text,
	"tokens_used" integer,
	"cost" numeric(10, 4),
	"duration" integer,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_purchased" numeric(10, 2) DEFAULT '0',
	"total_used" numeric(10, 2) DEFAULT '0',
	"overflow_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"last_reset_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_credits_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"product_run_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "polar_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text,
	"polar_payment_id" text NOT NULL,
	"polar_customer_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text NOT NULL,
	"product_id" text NOT NULL,
	"credits_granted" integer DEFAULT 0 NOT NULL,
	"refunded_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
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
CREATE TABLE "polar_checkout_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"checkout_id" text NOT NULL,
	"product_id" text NOT NULL,
	"checkout_url" text NOT NULL,
	"amount" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "polar_checkout_sessions_checkout_id_unique" UNIQUE("checkout_id")
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text,
	"rating" integer NOT NULL,
	"review_text" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "ai_models_provider_idx" ON "ai_models" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "ai_models_enabled_idx" ON "ai_models" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_polar_subscription_id" ON "subscriptions" USING btree ("polar_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_polar_customer_id" ON "subscriptions" USING btree ("polar_customer_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_tier" ON "subscriptions" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_current_period_end" ON "subscriptions" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_created_at" ON "subscriptions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_product_tags_product_id" ON "product_tags" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_tags_tag_id" ON "product_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_product_categories_product_id" ON "product_categories" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_categories_category_id" ON "product_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_product_runs_user_id" ON "product_runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_product_runs_created_at" ON "product_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_product_runs_user_id_created_at" ON "product_runs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_credit_transactions_user_id" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_polar_payments_user_id" ON "polar_payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_polar_payments_polar_payment_id" ON "polar_payments" USING btree ("polar_payment_id");--> statement-breakpoint
CREATE INDEX "idx_polar_payment_events_polar_event_id" ON "polar_payment_events" USING btree ("polar_event_id");--> statement-breakpoint
CREATE INDEX "idx_polar_payment_events_event_type" ON "polar_payment_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_polar_checkout_sessions_user_id" ON "polar_checkout_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_polar_checkout_sessions_checkout_id" ON "polar_checkout_sessions" USING btree ("checkout_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_reviews_product_user_unique" ON "product_reviews" USING btree ("product_id","user_id");