import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/slash-kit"

describe("editor/slash-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.SlashKit).toBeDefined()
  })
})
