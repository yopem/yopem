-- Step 1: Add slug column as nullable
ALTER TABLE "tools" ADD COLUMN "slug" text;--> statement-breakpoint

-- Step 2: Backfill slugs for existing tools using name field
-- Generate slugs from names, handling potential duplicates with numeric suffixes
DO $$
DECLARE
    tool_record RECORD;
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER;
BEGIN
    FOR tool_record IN SELECT id, name FROM tools WHERE slug IS NULL
    LOOP
        -- Generate base slug from name (lowercase, replace spaces/special chars with hyphens)
        base_slug := lower(regexp_replace(regexp_replace(tool_record.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
        base_slug := regexp_replace(base_slug, '-+', '-', 'g');
        base_slug := trim(both '-' from base_slug);
        
        -- Handle empty slugs
        IF base_slug = '' THEN
            base_slug := 'tool';
        END IF;
        
        final_slug := base_slug;
        counter := 1;
        
        -- Check for uniqueness and add suffix if needed
        WHILE EXISTS (SELECT 1 FROM tools WHERE slug = final_slug AND id != tool_record.id)
        LOOP
            final_slug := base_slug || '-' || counter;
            counter := counter + 1;
        END LOOP;
        
        -- Update the tool with generated slug
        UPDATE tools SET slug = final_slug WHERE id = tool_record.id;
    END LOOP;
END $$;--> statement-breakpoint

-- Step 3: Make slug NOT NULL and add unique constraint
ALTER TABLE "tools" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_slug_unique" UNIQUE("slug");