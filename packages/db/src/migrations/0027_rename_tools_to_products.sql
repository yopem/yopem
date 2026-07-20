-- Rename tables: tools -> products
ALTER TABLE "tools" RENAME TO "products";--> statement-breakpoint
ALTER TABLE "tool_categories" RENAME TO "product_categories";--> statement-breakpoint
ALTER TABLE "tool_tags" RENAME TO "product_tags";--> statement-breakpoint
ALTER TABLE "tool_reviews" RENAME TO "product_reviews";--> statement-breakpoint
ALTER TABLE "tool_runs" RENAME TO "product_runs";--> statement-breakpoint
ALTER TABLE "tool_versions" RENAME TO "product_versions";--> statement-breakpoint

-- Rename tool_id columns -> product_id
ALTER TABLE "product_categories" RENAME COLUMN "tool_id" TO "product_id";--> statement-breakpoint
ALTER TABLE "product_tags" RENAME COLUMN "tool_id" TO "product_id";--> statement-breakpoint
ALTER TABLE "product_reviews" RENAME COLUMN "tool_id" TO "product_id";--> statement-breakpoint
ALTER TABLE "product_runs" RENAME COLUMN "tool_id" TO "product_id";--> statement-breakpoint
ALTER TABLE "product_versions" RENAME COLUMN "tool_id" TO "product_id";--> statement-breakpoint

-- Rename credit_transactions.tool_run_id -> product_run_id
ALTER TABLE "credit_transactions" RENAME COLUMN "tool_run_id" TO "product_run_id";--> statement-breakpoint

-- Rename composite PK constraints
ALTER TABLE "product_tags" RENAME CONSTRAINT "tool_tags_tool_id_tag_id_pk" TO "product_tags_product_id_tag_id_pk";--> statement-breakpoint
ALTER TABLE "product_categories" RENAME CONSTRAINT "tool_categories_tool_id_category_id_pk" TO "product_categories_product_id_category_id_pk";--> statement-breakpoint

-- Rename unique index on tool_reviews
DROP INDEX "tool_reviews_tool_user_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "product_reviews_product_user_unique" ON "product_reviews" USING btree ("product_id","user_id");--> statement-breakpoint

-- Rename indexes
DROP INDEX "idx_tool_tags_tool_id";--> statement-breakpoint
CREATE INDEX "idx_product_tags_product_id" ON "product_tags" USING btree ("product_id");--> statement-breakpoint
DROP INDEX "idx_tool_tags_tag_id";--> statement-breakpoint
CREATE INDEX "idx_product_tags_tag_id" ON "product_tags" USING btree ("tag_id");--> statement-breakpoint
DROP INDEX "idx_tool_categories_tool_id";--> statement-breakpoint
CREATE INDEX "idx_product_categories_product_id" ON "product_categories" USING btree ("product_id");--> statement-breakpoint
DROP INDEX "idx_tool_categories_category_id";--> statement-breakpoint
CREATE INDEX "idx_product_categories_category_id" ON "product_categories" USING btree ("category_id");--> statement-breakpoint
DROP INDEX "idx_tool_runs_user_id";--> statement-breakpoint
CREATE INDEX "idx_product_runs_user_id" ON "product_runs" USING btree ("user_id");--> statement-breakpoint
DROP INDEX "idx_tool_runs_created_at";--> statement-breakpoint
CREATE INDEX "idx_product_runs_created_at" ON "product_runs" USING btree ("created_at");--> statement-breakpoint
DROP INDEX "idx_tool_runs_user_id_created_at";--> statement-breakpoint
CREATE INDEX "idx_product_runs_user_id_created_at" ON "product_runs" USING btree ("user_id","created_at");
