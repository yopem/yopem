import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/highlight-node"

describe("editor/highlight-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.HighlightLeaf).toBeDefined()
  })
})
