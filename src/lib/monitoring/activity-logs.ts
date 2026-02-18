import type { db as Database } from "@/lib/db"
import {
  activityLogsTable,
  type EventType,
  type Severity,
} from "@/lib/db/schema"
import { logger } from "@/lib/utils/logger"

export interface ActivityLogger {
  log: (params: {
    eventType: EventType
    severity: Severity
    description: string
    metadata?: Record<string, unknown>
  }) => Promise<void>
}

export const createActivityLogger = (db: typeof Database): ActivityLogger => {
  return {
    log: async ({
      eventType,
      severity,
      description,
      metadata,
    }: {
      eventType: EventType
      severity: Severity
      description: string
      metadata?: Record<string, unknown>
    }) => {
      try {
        await db.insert(activityLogsTable).values({
          timestamp: new Date(),
          eventType,
          severity,
          description,
          metadata: metadata ?? null,
        })

        logger.info({ eventType, severity, description }, "Activity logged")
      } catch (error) {
        logger.error(
          { error, eventType, description },
          "Failed to log activity",
        )
      }
    },
  }
}
