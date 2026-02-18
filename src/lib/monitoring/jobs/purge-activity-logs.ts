import { lt } from "drizzle-orm"

import { db } from "@/lib/db"
import { activityLogsTable } from "@/lib/db/schema"
import { logger } from "@/lib/utils/logger"

const RETENTION_DAYS = 30

export const purgeOldActivityLogs = async (): Promise<void> => {
  try {
    const cutoffDate = new Date(
      Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
    )

    const result = await db
      .delete(activityLogsTable)
      .where(lt(activityLogsTable.timestamp, cutoffDate))

    logger.info(
      { deletedCount: result.rowCount, cutoffDate },
      "Purged old activity logs",
    )
  } catch (error) {
    logger.error({ error }, "Failed to purge old activity logs")
    throw error
  }
}

if (require.main === module) {
  purgeOldActivityLogs()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
