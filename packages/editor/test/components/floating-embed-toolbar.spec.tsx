import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/floating-embed-toolbar"

describe("editor/floating-embed-toolbar", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.EmbedInsertStore).toBeDefined()
    expect(mod.useEmbedInsertOpen).toBeDefined()
    expect(mod.FloatingEmbedInsertToolbar).toBeDefined()
  })
})
