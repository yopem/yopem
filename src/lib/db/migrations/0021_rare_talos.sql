CREATE TABLE "activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "uptime_events" (
	"id" text PRIMARY KEY NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_activity_logs_timestamp" ON "activity_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_event_type" ON "activity_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_uptime_events_started_at" ON "uptime_events" USING btree ("started_at");