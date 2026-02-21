INSERT INTO tool_categories (tool_id, category_id)
SELECT id, category_id
FROM tools
WHERE category_id IS NOT NULL;

ALTER TABLE tools DROP COLUMN category_id;
