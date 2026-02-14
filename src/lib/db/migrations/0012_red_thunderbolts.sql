CREATE INDEX IF NOT EXISTS "idx_credit_transactions_user_id" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tool_tags_tool_id" ON "tool_tags" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tool_tags_tag_id" ON "tool_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tool_categories_tool_id" ON "tool_categories" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tool_categories_category_id" ON "tool_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tool_runs_user_id" ON "tool_runs" USING btree ("user_id");