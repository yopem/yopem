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
      "tailwindcss/enforce-sort-order": "off",
      "tailwindcss/no-deprecated-classes": "error",
      "tailwindcss/no-unnecessary-whitespace": "error",
      "react/rules-of-hooks": "error",
    },
    settings: {
      tailwindcss: {
        entryPoint: "./src/styles.css",
      },
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },

  resolve: {
    tsconfigPaths: true,
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
