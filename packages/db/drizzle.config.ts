import { defineConfig } from "drizzle-kit"

import { dbConnectionString } from "./src/connection"

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dbCredentials: {
    url: dbConnectionString(),
  },
})
