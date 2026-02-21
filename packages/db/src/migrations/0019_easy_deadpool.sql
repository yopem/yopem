ALTER TABLE "polar_checkout_sessions" ADD COLUMN "checkout_url" text;
ALTER TABLE "polar_checkout_sessions" ADD COLUMN "amount" text;
UPDATE "polar_checkout_sessions" SET "checkout_url" = '', "amount" = '0' WHERE "checkout_url" IS NULL;
ALTER TABLE "polar_checkout_sessions" ALTER COLUMN "checkout_url" SET NOT NULL;
ALTER TABLE "polar_checkout_sessions" ALTER COLUMN "amount" SET NOT NULL;
