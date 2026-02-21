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
CREATE TABLE "credit_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"tool_run_id" text,
	"created_at" timestamp DEFAULT now()
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
CREATE TABLE "tool_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"tool_id" text NOT NULL,
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
CREATE TABLE "tool_tags" (
	"tool_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "tool_tags_tool_id_tag_id_pk" PRIMARY KEY("tool_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tool_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"tool_id" text NOT NULL,
	"version" integer NOT NULL,
	"config" jsonb,
	"system_role" text,
	"user_instruction_template" text,
	"input_schema" jsonb,
	"output_format" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"config" jsonb,
	"system_role" text,
	"user_instruction_template" text,
	"input_schema" jsonb,
	"output_format" text DEFAULT 'plain',
	"cost_per_run" numeric(10, 4) DEFAULT '0',
	"is_public" boolean DEFAULT true,
	"category_id" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_purchased" numeric(10, 2) DEFAULT '0',
	"total_used" numeric(10, 2) DEFAULT '0',
	"last_reset_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_credits_user_id_unique" UNIQUE("user_id")
);
