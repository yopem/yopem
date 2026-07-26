import { describe, expect, test } from "vitest"

import { useIsMobile } from "ui/hooks/use-mobile"

describe("use-mobile", () => {
  test("useIsMobile is exported", () => {
    expect(useIsMobile).toBeDefined()
  })
})
