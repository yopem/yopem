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
  lint: {
    plugins: [
      "eslint",
      "import",
      "jsx-a11y",
      "oxc",
      "promise",
      "react",
      "react-perf",
      "typescript",
      "unicorn",
    ],
    jsPlugins: ["oxlint-tailwindcss"],
    rules: {
      "tailwindcss/no-unknown-classes": "error",
      "tailwindcss/no-conflicting-classes": "error",
      "tailwindcss/enforce-sort-order": "warn",
      "tailwindcss/no-deprecated-classes": "error",
      "tailwindcss/no-unnecessary-whitespace": "error",
      "react/rules-of-hooks": "error",
    },
    settings: {
      tailwindcss: {
        entryPoint: "./src/style.css",
      },
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
})
