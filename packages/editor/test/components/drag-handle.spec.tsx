import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/drag-handle"

describe("editor/drag-handle", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.DragHandle).toBeDefined()
  })
})
