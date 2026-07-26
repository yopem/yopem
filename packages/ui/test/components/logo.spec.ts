import { describe, expect, test } from "vitest"

import Logo from "ui/components/logo"

describe("logo", () => {
  test("default export is defined", () => {
    expect(Logo).toBeDefined()
  })
})
