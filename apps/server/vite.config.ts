import build from "@hono/vite-build/node"
import devServer from "@hono/vite-dev-server"
import nodeAdapter from "@hono/vite-dev-server/node"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, loadEnv } from "vite-plus"

import { isDev, serverPort } from "env"

const __dirname = dirname(fileURLToPath(import.meta.url))

const env = loadEnv(isDev ? "DEV" : "PROD", resolve(__dirname, "../.."), "")

Object.assign(process.env, env)

export default defineConfig({
  envDir: "../..",
  envPrefix: ["VITE_", "PUBLIC_"],

  server: {
    port: serverPort,
    host: "0.0.0.0",
  },
  ssr: {
    noExternal: [
      "ui",
      "auth",
      "db",
      "env",
      "logger",
      "utils",
      "cache",
      "ai",
      "payments",
      "storage",
    ],
    external: ["sharp"],
  },
  resolve: {
    tsconfigPaths: true,
  },

  test: {
    name: "server",
    globalSetup: ["./test/setup.ts"],
  },
  plugins: [
    devServer({
      entry: "./src/index.ts",
      adapter: nodeAdapter(),
    }),
    build({
      entry: "./src/index.ts",
      port: serverPort,
      external: ["sharp"],
    }),
  ],
})
