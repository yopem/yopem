import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/kbd-node"

describe("editor/kbd-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.KbdLeaf).toBeDefined()
  })
})
