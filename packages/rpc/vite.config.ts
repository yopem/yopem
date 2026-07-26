import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite-plus"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    name: "rpc",
  },
  resolve: {
    alias: {
      rpc: resolve(__dirname, "./src"),
    },
  },
})
