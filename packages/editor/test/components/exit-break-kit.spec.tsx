import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/exit-break-kit"

describe("editor/exit-break-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ExitBreakKit).toBeDefined()
  })
})
