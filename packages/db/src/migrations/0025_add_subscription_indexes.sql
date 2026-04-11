-- Add indexes to subscriptions table for better query performance
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_id" ON "subscriptions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_polar_subscription_id" ON "subscriptions" ("polar_subscription_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_polar_customer_id" ON "subscriptions" ("polar_customer_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_tier" ON "subscriptions" ("tier");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_status" ON "subscriptions" ("status");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_current_period_end" ON "subscriptions" ("current_period_end");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_created_at" ON "subscriptions" ("created_at");
