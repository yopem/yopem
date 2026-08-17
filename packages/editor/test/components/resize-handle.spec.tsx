import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/resize-handle"

describe("editor/resize-handle", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.mediaResizeHandleVariants).toBeDefined()
    expect(mod.ResizeHandle).toBeDefined()
    expect(mod.Resizable).toBeDefined()
  })
})
