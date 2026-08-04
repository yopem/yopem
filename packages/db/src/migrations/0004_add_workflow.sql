ALTER TABLE "products" DROP COLUMN IF EXISTS "system_role";
ALTER TABLE "products" DROP COLUMN IF EXISTS "user_instruction_template";
ALTER TABLE "products" DROP COLUMN IF EXISTS "input_variable";
ALTER TABLE "products" ADD COLUMN "workflow" jsonb;
ALTER TABLE "product_versions" DROP COLUMN IF EXISTS "system_role";
ALTER TABLE "product_versions" DROP COLUMN IF EXISTS "user_instruction_template";
ALTER TABLE "product_versions" DROP COLUMN IF EXISTS "input_variable";
ALTER TABLE "product_versions" ADD COLUMN "workflow" jsonb;
