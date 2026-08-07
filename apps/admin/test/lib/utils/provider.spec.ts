import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/lib/utils/provider"

describe("apps/admin/lib/utils/provider", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.providerNames).toBeDefined()
    expect(mod.findModelProvider).toBeDefined()
    expect(mod.getProviderMismatchMessage).toBeDefined()
    expect(mod.validateModelProviderMatch).toBeDefined()
  })
})
