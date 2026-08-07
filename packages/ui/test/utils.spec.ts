import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/utils"

describe("ui/utils", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.cn).toBeDefined()
    expect(mod.cva).toBeDefined()
  })
})
