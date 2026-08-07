import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/block-selection"

describe("editor/block-selection", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.blockSelectionVariants).toBeDefined()
    expect(mod.BlockSelection).toBeDefined()
  })
})
