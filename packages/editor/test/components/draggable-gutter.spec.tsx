import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/draggable-gutter"

describe("editor/draggable-gutter", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.DraggableGutter).toBeDefined()
  })
})
