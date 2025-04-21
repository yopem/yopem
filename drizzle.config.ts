import { defineConfig, type Config } from "drizzle-kit"

import { databaseUrl } from "@/lib/utils/env"

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema",
  out: "./src/lib/db/migrations",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
}) satisfies Config
