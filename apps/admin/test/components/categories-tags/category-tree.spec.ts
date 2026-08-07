import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/categories-tags/category-tree"

describe("apps/admin/components/categories-tags/category-tree", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.flattenCategoryTree).toBeDefined()
    expect(mod.getCategoryDescendantIds).toBeDefined()
  })
})
