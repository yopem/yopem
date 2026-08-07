import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/feature-builder-header"

describe("apps/admin/components/products/feature-builder-header", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.FeatureBuilderHeader).toBeDefined()
  })
})
