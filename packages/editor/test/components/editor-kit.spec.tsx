import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/editor-kit"

describe("editor/editor-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.EditorKit).toBeDefined()
  })
})
