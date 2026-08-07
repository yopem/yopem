import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/range-slider"

describe("apps/admin/components/products/range-slider", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.RangeSlider).toBeDefined()
  })
})
