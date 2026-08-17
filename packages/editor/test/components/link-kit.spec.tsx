import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/link-kit"

describe("editor/link-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.LinkKit).toBeDefined()
  })
})
