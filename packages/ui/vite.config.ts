import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite-plus"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    name: "ui",
    environment: "jsdom",
  },
  resolve: {
    alias: {
      ui: resolve(__dirname, "./src"),
    },
  },
})
