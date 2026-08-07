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
    dedupe: ["react", "react-dom"],
    alias: {
      "ui/components": resolve(__dirname, "./src/components"),
      "ui/hooks": resolve(__dirname, "./src/hooks"),
      ui: resolve(__dirname, "./src"),
    },
  },
})
