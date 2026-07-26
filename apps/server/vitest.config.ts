import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    name: "server",
  },
  resolve: {
    alias: {
      server: resolve(__dirname, "./src"),
    },
  },
})
