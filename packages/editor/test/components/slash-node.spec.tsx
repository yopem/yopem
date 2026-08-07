import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/slash-node"

describe("editor/slash-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.SlashInputElement).toBeDefined()
  })
})
