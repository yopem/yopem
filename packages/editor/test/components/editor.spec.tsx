import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/editor"

describe("editor/editor", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.EditorContainer).toBeDefined()
    expect(mod.Editor).toBeDefined()
    expect(mod.EditorView).toBeDefined()
  })
})
