import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/api-key-selector"

describe("apps/admin/components/products/api-key-selector", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ApiKeySelector).toBeDefined()
  })
})
