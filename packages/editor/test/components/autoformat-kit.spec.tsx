import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/autoformat-kit"

describe("editor/autoformat-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.AutoformatKit).toBeDefined()
  })
})
