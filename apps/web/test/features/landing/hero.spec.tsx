import { describe, expect, test } from "vite-plus/test"

import { Hero } from "@/features/landing/hero"

describe("Hero component", () => {
  test("is defined", () => {
    expect(Hero).toBeDefined()
  })
})
