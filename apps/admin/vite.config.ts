import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { resolve } from "node:path"
import { loadEnv, defineConfig, lazyPlugins } from "vite-plus"

import { isDev } from "env"

const env = loadEnv(isDev ? "DEV" : "PROD", resolve(__dirname, "../.."), "")

Object.assign(process.env, env)

export default defineConfig({
  envDir: "../..",
  envPrefix: ["VITE_", "PUBLIC_"],

  resolve: {
    tsconfigPaths: true,
  },

  test: {
    name: "admin",
    environment: "jsdom",
  },

  plugins: lazyPlugins(() => [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ]),
})
