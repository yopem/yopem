import { eq } from "drizzle-orm"

import type { db as Database } from "@/lib/db"
import { uptimeEventsTable } from "@/lib/db/schema"
import { logger } from "@/lib/utils/logger"

export interface UptimeTracker {
  recordDowntimeStart: (reason?: string) => Promise<void>
  recordDowntimeEnd: () => Promise<void>
}

export const createUptimeTracker = (db: typeof Database): UptimeTracker => {
  let currentDowntimeId: string | null = null

  return {
    recordDowntimeStart: async (reason?: string) => {
      if (currentDowntimeId) {
        logger.warn("Downtime already in progress, not starting new downtime")
        return
      }

      try {
        const [result] = await db
          .insert(uptimeEventsTable)
          .values({
            startedAt: new Date(),
            reason: reason ?? null,
          })
          .returning({ id: uptimeEventsTable.id })

        if (result) {
          currentDowntimeId = result.id
          logger.info({ downtimeId: result.id, reason }, "Downtime started")
        }
      } catch (error) {
        logger.error({ error }, "Failed to record downtime start")
      }
    },

    recordDowntimeEnd: async () => {
      if (!currentDowntimeId) {
        logger.warn("No downtime in progress to end")
        return
      }

      try {
        const endedAt = new Date()
        const [downtime] = await db
          .select({ startedAt: uptimeEventsTable.startedAt })
          .from(uptimeEventsTable)
          .where(eq(uptimeEventsTable.id, currentDowntimeId))

        if (!downtime) {
          logger.warn(`Downtime ${currentDowntimeId} not found`)
          currentDowntimeId = null
          return
        }

        const durationSeconds = Math.floor(
          (endedAt.getTime() - downtime.startedAt.getTime()) / 1000,
        )

        await db
          .update(uptimeEventsTable)
          .set({
            endedAt,
            durationSeconds,
          })
          .where(eq(uptimeEventsTable.id, currentDowntimeId))

        logger.info(
          { downtimeId: currentDowntimeId, durationSeconds },
          "Downtime ended",
        )
        currentDowntimeId = null
      } catch (error) {
        logger.error({ error }, "Failed to record downtime end")
      }
    },
  }
}
