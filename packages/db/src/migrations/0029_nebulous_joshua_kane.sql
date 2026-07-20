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
CREATE INDEX "ai_models_provider_idx" ON "ai_models" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "ai_models_enabled_idx" ON "ai_models" USING btree ("is_enabled");