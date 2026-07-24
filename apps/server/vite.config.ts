import build from "@hono/vite-build/node"
import devServer from "@hono/vite-dev-server"
import nodeAdapter from "@hono/vite-dev-server/node"
import { resolve } from "node:path"
import { defineConfig, loadEnv } from "vite"

const env = loadEnv(
  process.env["APP_ENV"] ?? "development",
  resolve(__dirname, "../.."),
  "",
)

Object.assign(process.env, env)

const serverPort = Number(env["SERVER_PORT"]) || 4000

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
      "orpc",
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
