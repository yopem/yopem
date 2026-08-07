import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/mark-toolbar-button"

describe("editor/mark-toolbar-button", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.MarkToolbarButton).toBeDefined()
  })
})
