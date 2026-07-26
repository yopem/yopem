import { describe, expect, test } from "vite-plus/test"

import { useIsTouchDevice } from "ui/hooks/use-touch-device"

describe("use-touch-device", () => {
  test("useIsTouchDevice is exported", () => {
    expect(useIsTouchDevice).toBeDefined()
  })
})
