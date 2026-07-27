import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join, resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ssrDir = resolve(__dirname, "../.output/server/_ssr")

const SSR_FILE_HEADER =
  "// nitro/tanstack-start ssr bundle order + react-dedupe fix"

const RUNTIME_REACT_REQUIRE = `__require("react")`
const BUNDLED_REACT_FACTORY = `require_react()`

function findSsrFile() {
  if (!readdirSync(ssrDir).includes("ssr.mjs")) return null
  return join(ssrDir, "ssr.mjs")
}

function findLineRange(lines, predicate) {
  for (let i = 0; i < lines.length; i++) {
    if (predicate(lines[i], i)) return i
  }
  return -1
}

function findBlockEnd(lines, startIdx) {
  let depth = 0
  let started = false
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "{") {
        depth++
        started = true
      } else if (ch === "}") {
        depth--
        if (started && depth === 0) return i
      }
    }
  }
  return -1
}

function patch(src) {
  const lines = src.split("\n")
  if (lines[0] === SSR_FILE_HEADER) {
    return { changed: false, reason: "already patched", output: src }
  }

  const notes = []

  const reactDeduped = dedupeRuntimeReactRequire(lines, notes)

  const orderFixed = fixCreateServerFnOrder(reactDeduped, notes)

  const output = orderFixed.join("\n")
  if (notes.length === 0) {
    return { changed: false, reason: "no fixes needed", output: src }
  }
  return {
    changed: true,
    reason: notes.join("; "),
    output: [SSR_FILE_HEADER, output].join("\n"),
  }
}

function dedupeRuntimeReactRequire(lines, notes) {
  if (!lines.some((l) => l.includes(RUNTIME_REACT_REQUIRE))) return lines
  const hasBundledFactory = lines.some((l) => l.includes(BUNDLED_REACT_FACTORY))
  if (!hasBundledFactory) {
    throw new Error(
      `fix-ssr-bundle: found runtime ${RUNTIME_REACT_REQUIRE} but the ` +
        `bundled React factory (${BUNDLED_REACT_FACTORY}) is not present in ` +
        `this file; cannot dedupe. The bundle layout may have changed.`,
    )
  }
  const count = lines.filter((l) => l.includes(RUNTIME_REACT_REQUIRE)).length
  if (count === 0) return lines
  const replaced = lines.map((l) =>
    l.split(RUNTIME_REACT_REQUIRE).join(BUNDLED_REACT_FACTORY),
  )
  notes.push(`rewrote ${count} runtime react require(s) to bundled React`)
  return replaced
}

function fixCreateServerFnOrder(lines, notes) {
  const createServerFnDef = "var createServerFn = (options, __opts) => {"
  const defStartIdx = findLineRange(lines, (l) =>
    l.startsWith(createServerFnDef),
  )
  if (defStartIdx === -1) {
    throw new Error(
      `fix-ssr-bundle: could not locate createServerFn definition ` +
        `("${createServerFnDef}"). The bundle layout may have changed; ` +
        `this patch needs updating.`,
    )
  }
  const defEndIdx = findBlockEnd(lines, defStartIdx)
  if (defEndIdx === -1) {
    throw new Error(
      "fix-ssr-bundle: could not find the end of createServerFn definition block",
    )
  }

  const firstUseIdx = findLineRange(
    lines,
    (l) => l.startsWith("var ") && l.includes("createServerFn("),
  )
  if (firstUseIdx === -1) return lines

  if (defStartIdx < firstUseIdx) return lines

  const block = lines.slice(defStartIdx, defEndIdx + 1)
  const without = lines.slice(0, defStartIdx).concat(lines.slice(defEndIdx + 1))

  const insertIdx = findLineRange(
    without,
    (l) => l.startsWith("var ") && l.includes("createServerFn("),
  )
  if (insertIdx === -1) {
    throw new Error(
      "fix-ssr-bundle: could not relocate usage after removing definition block",
    )
  }

  notes.push("moved createServerFn definition to precede first use")
  return without
    .slice(0, insertIdx)
    .concat(block)
    .concat(without.slice(insertIdx))
}

const file = findSsrFile()
if (!file) {
  console.info("fix-ssr-bundle: no .output/server/_ssr/ssr.mjs found, skipping")
  process.exit(0)
}

const original = readFileSync(file, "utf8")
const result = patch(original)
if (result.changed) {
  writeFileSync(file, result.output)
  console.info(`fix-ssr-bundle: patched ${file} — ${result.reason}`)
} else {
  console.info(`fix-ssr-bundle: no change (${result.reason})`)
}
