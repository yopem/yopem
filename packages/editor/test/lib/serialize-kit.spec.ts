import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/lib/serialize-kit"

describe("editor/serialize", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.SerializeKit).toBeDefined()
  })
})
