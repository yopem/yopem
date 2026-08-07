import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/hooks/use-touch-device"

describe("ui/hooks/use-touch-device", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.useIsTouchDevice).toBeDefined()
  })
})
