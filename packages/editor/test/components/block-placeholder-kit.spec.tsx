import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/block-placeholder-kit"

describe("editor/block-placeholder-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.BlockPlaceholderKit).toBeDefined()
  })
})
