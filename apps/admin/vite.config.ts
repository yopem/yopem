import tailwindCSS from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { defineConfig, loadEnv } from "vite-plus"

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, resolve(__dirname, "../.."), ""))

  const adminPort = Number(process.env["ADMIN_PORT"]) || 3001

  return {
    envPrefix: ["VITE_", "PUBLIC_"],
    envDir: "../..",
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
    server: {
      port: adminPort,
      host: "0.0.0.0",
    },
    resolve: {
      tsconfigPaths: true,
    },
    ssr: {
      noExternal: [
        "ui",
        "auth",
        "db",
        "env",
        "logger",
        "orpc",
        "rpc",
        "utils",
        "cache",
        "ai",
        "payments",
        "storage",
      ],
    },
    plugins: [tanstackStart(), react(), tailwindCSS()],
  }
})
