import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/tag-selector"

describe("apps/admin/components/products/tag-selector", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.TagSelector).toBeDefined()
  })
})
