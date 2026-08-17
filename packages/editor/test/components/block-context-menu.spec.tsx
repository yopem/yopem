import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/block-context-menu"

describe("editor/block-context-menu", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.BlockContextMenu).toBeDefined()
  })
})
