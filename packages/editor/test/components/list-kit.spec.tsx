import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/list-kit"

describe("editor/list-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ListKit).toBeDefined()
  })
})
