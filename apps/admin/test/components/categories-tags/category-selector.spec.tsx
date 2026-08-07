import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/categories-tags/category-selector"

describe("apps/admin/components/categories-tags/category-selector", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.CategorySelector).toBeDefined()
  })
})
