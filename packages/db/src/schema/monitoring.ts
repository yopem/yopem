import { createCustomId } from "@repo/shared/custom-id"
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

export const uptimeEventsTable = pgTable(
  "uptime_events",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    startedAt: timestamp("started_at").notNull(),
    endedAt: timestamp("ended_at"),
    durationSeconds: integer("duration_seconds"),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    startedAtIdx: index("idx_uptime_events_started_at").on(table.startedAt),
  }),
)

export const insertUptimeEventSchema = createInsertSchema(uptimeEventsTable)
export const updateUptimeEventSchema = createUpdateSchema(uptimeEventsTable)

export type SelectUptimeEvent = typeof uptimeEventsTable.$inferSelect
export type InsertUptimeEvent = typeof uptimeEventsTable.$inferInsert

export const severityEnum = [
  "critical",
  "error",
  "warning",
  "info",
  "debug",
] as const
export type Severity = (typeof severityEnum)[number]

export const eventTypeEnum = [
  "auth",
  "system",
  "payment",
  "tool",
  "api",
  "webhook",
] as const
export type EventType = (typeof eventTypeEnum)[number]

export const activityLogsTable = pgTable(
  "activity_logs",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    eventType: text("event_type", { enum: eventTypeEnum }).notNull(),
    severity: text("severity", { enum: severityEnum }).notNull(),
    description: text("description").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    timestampIdx: index("idx_activity_logs_timestamp").on(table.timestamp),
    eventTypeIdx: index("idx_activity_logs_event_type").on(table.eventType),
  }),
)

export const insertActivityLogSchema = createInsertSchema(activityLogsTable)
export const updateActivityLogSchema = createUpdateSchema(activityLogsTable)

export type SelectActivityLog = typeof activityLogsTable.$inferSelect
export type InsertActivityLog = typeof activityLogsTable.$inferInsert
