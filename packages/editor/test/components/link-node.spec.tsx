import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/link-node"

describe("editor/link-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.LinkElement).toBeDefined()
  })
})
