import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/transform"

describe("editor/transform", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.insertBlock).toBeDefined()
    expect(mod.insertInlineElement).toBeDefined()
    expect(mod.setBlockType).toBeDefined()
    expect(mod.getBlockType).toBeDefined()
  })
})
