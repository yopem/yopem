import { env } from "@repo/env"
import { defineConfig, type Config } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema",
  out: "./src/migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
}) satisfies Config
