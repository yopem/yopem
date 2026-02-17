import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"

export const polarPaymentEventsTable = pgTable(
  "polar_payment_events",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    polarEventId: text("polar_event_id").notNull().unique(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    polarEventIdIdx: index("idx_polar_payment_events_polar_event_id").on(
      table.polarEventId,
    ),
    eventTypeIdx: index("idx_polar_payment_events_event_type").on(
      table.eventType,
    ),
  }),
)

export const insertPolarPaymentEventSchema = createInsertSchema(
  polarPaymentEventsTable,
)
export const updatePolarPaymentEventSchema = createUpdateSchema(
  polarPaymentEventsTable,
)

export type SelectPolarPaymentEvent =
  typeof polarPaymentEventsTable.$inferSelect
export type InsertPolarPaymentEvent =
  typeof polarPaymentEventsTable.$inferInsert
