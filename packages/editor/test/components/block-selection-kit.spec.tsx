import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/block-selection-kit"

describe("editor/block-selection-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.hasSelectableClass).toBeDefined()
    expect(mod.BlockSelectionKit).toBeDefined()
  })
})
