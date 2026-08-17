import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/floating-toolbar-kit"

describe("editor/floating-toolbar-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.FloatingToolbarKit).toBeDefined()
  })
})
