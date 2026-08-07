import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/blockquote-node"

describe("editor/blockquote-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.BlockquoteElement).toBeDefined()
  })
})
