import tailwindCSS from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const clientEnvDefines: Record<string, string> = {}

const publicApiUrl = process.env["PUBLIC_API_URL"]
if (publicApiUrl) {
  clientEnvDefines["process.env.PUBLIC_API_URL"] = JSON.stringify(publicApiUrl)
}

export default defineConfig({
  envPrefix: "PUBLIC_",
  define: clientEnvDefines,
  server: {
    port: Number(process.env["WEB_PORT"]) || 3000,
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
