CREATE TABLE "tool_categories" (
	"tool_id" text NOT NULL,
	"category_id" text NOT NULL,
	CONSTRAINT "tool_categories_tool_id_category_id_pk" PRIMARY KEY("tool_id","category_id")
);
