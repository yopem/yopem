import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/floating-toolbar-buttons"

describe("editor/floating-toolbar-buttons", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.FloatingToolbarButtons).toBeDefined()
  })
})
