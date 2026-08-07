import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/onboarding/empty-product-state"

describe("apps/admin/components/onboarding/empty-product-state", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.EmptyProductState).toBeDefined()
  })
})
