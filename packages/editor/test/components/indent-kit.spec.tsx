import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/indent-kit"

describe("editor/indent-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.IndentKit).toBeDefined()
  })
})
