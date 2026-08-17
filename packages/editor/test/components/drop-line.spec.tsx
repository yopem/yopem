import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/drop-line"

describe("editor/drop-line", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.DropLine).toBeDefined()
  })
})
