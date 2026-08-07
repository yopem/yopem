import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/block-list"

describe("editor/block-list", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.BlockList).toBeDefined()
  })
})
