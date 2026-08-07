import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/code-node"

describe("editor/code-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.CodeLeaf).toBeDefined()
  })
})
