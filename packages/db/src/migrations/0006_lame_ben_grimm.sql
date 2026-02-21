CREATE TABLE "admin_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_settings_setting_key_unique" UNIQUE("setting_key")
);
