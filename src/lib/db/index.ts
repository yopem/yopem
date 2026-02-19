import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "@/lib/db/schema"
import { appEnv, databaseUrl } from "@/lib/env/server"
import { logger } from "@/lib/utils/logger"

const pool = new Pool({
  connectionString: databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on("error", (error: Error) => {
  logger.error(`Unexpected error on idle database connection: ${error.message}`)
  logPoolMetrics()
})

pool.on("connect", () => {
  if (appEnv === "development") {
    logger.info("New database connection established")
  }
})

export const db = drizzle(pool, {
  schema,
})

function getPoolMetrics() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    active: pool.totalCount - pool.idleCount,
  }
}

function logPoolMetrics() {
  const metrics = getPoolMetrics()
  logger.info(
    `[DB Pool] Total: ${metrics.total} | Active: ${metrics.active} | Idle: ${metrics.idle} | Waiting: ${metrics.waiting}`,
  )
}
