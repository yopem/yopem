import { SQL } from "bun"
import { drizzle } from "drizzle-orm/bun-sql"

import { databaseUrl, isDev } from "env"

import * as schema from "./schema"

const sql = new SQL({
  url: databaseUrl,
  max: 20,
  idleTimeout: 30,
  connectionTimeout: 5,
  onconnect: () => {
    if (isDev) {
      console.info("New database connection established")
    }
  },
  onclose: (error) => {
    if (!error) return
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes("Idle timeout")) {
      console.error(`Database connection closed: ${message}`)
    }
  },
})

export const db = drizzle(sql, { schema })
