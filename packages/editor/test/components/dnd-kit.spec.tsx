import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/dnd-kit"

describe("editor/dnd-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.DndKit).toBeDefined()
  })
})
