import { describe, expect, test } from "vite-plus/test"

import { cn, cva } from "ui/index"

describe("index", () => {
  test("cn is exported", () => {
    expect(cn).toBeDefined()
  })

  test("cva is exported", () => {
    expect(cva).toBeDefined()
  })
})
