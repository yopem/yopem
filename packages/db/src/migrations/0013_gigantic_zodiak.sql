CREATE TABLE "tool_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"tool_id" text NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"review_text" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "excerpt" text;--> statement-breakpoint
CREATE UNIQUE INDEX "tool_reviews_tool_user_unique" ON "tool_reviews" USING btree ("tool_id","user_id");