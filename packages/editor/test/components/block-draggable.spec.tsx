import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/block-draggable"

describe("editor/block-draggable", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.BlockDraggable).toBeDefined()
  })
})
