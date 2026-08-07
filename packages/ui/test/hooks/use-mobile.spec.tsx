import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/hooks/use-mobile"

describe("ui/hooks/use-mobile", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.useIsMobile).toBeDefined()
  })
})
