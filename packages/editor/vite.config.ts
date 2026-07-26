import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite-plus"

const __dirname = dirname(fileURLToPath(import.meta.url))

function getExportTarget(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    if (typeof record.import === "string") return record.import
    if (typeof record.default === "string") return record.default
    return getExportTarget(Object.values(record)[0])
  }
  return undefined
}

function editorSelfResolvePlugin() {
  const pkg = JSON.parse(
    readFileSync(resolve(__dirname, "./package.json"), "utf8"),
  ) as { exports: Record<string, unknown> }
  const exportTargets = new Map<string, string>()

  for (const [key, value] of Object.entries(pkg.exports)) {
    const target = getExportTarget(value)
    if (!target) continue
    const sub = key === "." ? "" : key.startsWith("./") ? key.slice(2) : key
    exportTargets.set(sub, resolve(__dirname, target))
  }

  function resolveSub(sub: string): string | null {
    if (sub === "") {
      return exportTargets.get("") ?? null
    }

    const exported = exportTargets.get(sub)
    if (exported) return exported

    const tsxPath = resolve(__dirname, "./src", `${sub}.tsx`)
    if (existsSync(tsxPath)) return tsxPath

    const tsPath = resolve(__dirname, "./src", `${sub}.ts`)
    if (existsSync(tsPath)) return tsPath

    return null
  }

  return {
    name: "editor-self-resolve",
    enforce: "pre" as const,
    resolveId(id: string) {
      if (id === "editor") return resolveSub("")
      if (id.startsWith("editor/")) return resolveSub(id.slice(7))
      return null
    },
  }
}

function cssStubPlugin() {
  return {
    name: "css-stub",
    enforce: "pre" as const,
    resolveId(id: string) {
      if (id.endsWith(".css")) return id
      return null
    },
    load(id: string) {
      if (id.endsWith(".css")) return ""
      return null
    },
  }
}

export default defineConfig({
  test: {
    name: "editor",
  },
  plugins: [editorSelfResolvePlugin(), cssStubPlugin()],
  ssr: {
    noExternal: ["react-tweet"],
  },
  lint: {
    plugins: [
      "eslint",
      "import",
      "jsx-a11y",
      "nextjs",
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
