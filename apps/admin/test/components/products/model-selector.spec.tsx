import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/model-selector"

describe("apps/admin/components/products/model-selector", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ModelSelector).toBeDefined()
  })
})
