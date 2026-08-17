import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite-plus"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    name: "db",
    server: {
      deps: {
        inline: ["drizzle-orm/bun-sql", "drizzle-orm"],
      },
    },
  },
  resolve: {
    alias: {
      db: resolve(__dirname, "./src"),
    },
  },
})
