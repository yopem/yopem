import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/logo"

describe("ui/components/logo", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Logo).toBeDefined()
  })
})
