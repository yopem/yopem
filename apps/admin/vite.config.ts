import tailwindCSS from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite-plus"
import tsconfigPaths from "vite-tsconfig-paths"

import { adminPort } from "env/ports"

const clientEnvDefines = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key]) => key.startsWith("PUBLIC_") || key === "APP_ENV")
    .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value ?? "")]),
)

export default defineConfig({
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
    jsPlugins: ["eslint-plugin-better-tailwindcss"],
    rules: {
      "better-tailwindcss/enforce-canonical-classes": "error",
      "better-tailwindcss/enforce-consistent-class-order": "off",
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
      "better-tailwindcss/enforce-shorthand-classes": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-deprecated-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "warn",
      "better-tailwindcss/no-restricted-classes": "error",
      "better-tailwindcss/no-unknown-classes": "off",
      "better-tailwindcss/no-unnecessary-whitespace": "warn",
      "react/rules-of-hooks": "error",
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "../../packages/ui/src/style.css",
      },
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  envDir: "../..",
  envPrefix: "PUBLIC_",
  define: clientEnvDefines,
  server: {
    port: adminPort,
    host: "0.0.0.0",
  },
  ssr: {
    noExternal: [
      "ui",
      "auth",
      "db",
      "env",
      "logger",
      "orpc",
      "shared",
      "cache",
      "ai",
      "payments",
      "storage",
    ],
  },
  plugins: [tsconfigPaths(), tanstackStart(), react(), tailwindCSS()],
})
