import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "@/lib/db/schema"
import { databaseUrl } from "@/lib/env/server"

const pool = new Pool({
  connectionString: databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on("error", (err) => {
  console.error("Unexpected error on idle database connection", err)
})

export const db = drizzle(pool, {
  schema,
})
