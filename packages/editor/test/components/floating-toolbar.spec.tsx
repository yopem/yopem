import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/floating-toolbar"

describe("editor/floating-toolbar", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.FloatingToolbar).toBeDefined()
  })
})
