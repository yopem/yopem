import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import tailwindCSS from "@tailwindcss/vite"

const clientEnvDefines = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key]) => key.startsWith("PUBLIC_") || key === "APP_ENV")
    .flatMap(([key, value]) => [
      [`process.env.${key}`, JSON.stringify(value)],
      [`process.env["${key}"]`, JSON.stringify(value)],
    ]),
)

export default defineConfig({
  envPrefix: "PUBLIC_",
  define: clientEnvDefines,
  server: {
    port: Number(process.env["WEB_PORT"]) || 3000,
  },
  plugins: [tsconfigPaths(), tanstackStart(), react(), tailwindCSS()],
})
