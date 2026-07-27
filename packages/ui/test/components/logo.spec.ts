import { describe, expect, test } from "vite-plus/test"

import { Logo } from "ui/components/logo"

describe("logo", () => {
  test("Logo is exported", () => {
    expect(Logo).toBeDefined()
  })
})
