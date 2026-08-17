import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/block-menu-kit"

describe("editor/block-menu-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.BlockMenuKit).toBeDefined()
  })
})
