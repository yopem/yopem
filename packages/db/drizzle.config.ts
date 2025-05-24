import { databaseUrl } from "@yopem/constant"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl!,
  },
})
