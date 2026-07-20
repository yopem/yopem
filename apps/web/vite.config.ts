import tailwindCSS from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { defineConfig, loadEnv } from "vite-plus"

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, resolve(__dirname, "../.."), ""))

  const webPort = Number(process.env["WEB_PORT"]) || 3000

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
          entryPoint: "./src/globals.css",
        },
      },
      options: {
        typeAware: true,
        typeCheck: true,
      },
    },
    server: {
      port: webPort,
      host: "0.0.0.0",
      proxy: {
        "/rpc": {
          target: "http://localhost:4000",
          changeOrigin: true,
        },
      },
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [tanstackStart(), react(), tailwindCSS()],
  }
})
