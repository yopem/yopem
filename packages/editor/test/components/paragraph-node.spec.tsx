import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/paragraph-node"

describe("editor/paragraph-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ParagraphElement).toBeDefined()
  })
})
