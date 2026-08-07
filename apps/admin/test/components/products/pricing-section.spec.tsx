import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/pricing-section"

describe("apps/admin/components/products/pricing-section", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.PricingSection).toBeDefined()
  })
})
