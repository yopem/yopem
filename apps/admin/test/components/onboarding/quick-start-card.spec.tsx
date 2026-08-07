import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/onboarding/quick-start-card"

describe("apps/admin/components/onboarding/quick-start-card", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.QuickStartCard).toBeDefined()
  })
})
