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
    console.error(
      `Database connection closed: ${error instanceof Error ? error.message : String(error)}`,
    )
  },
})

export const db = drizzle(sql, { schema })
