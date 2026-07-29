import { describe, expect, test } from "vite-plus/test"

import { CategoryList } from "@/components/categories-tags/category-list"

describe("CategoryList", () => {
  test("is a React component", () => {
    expect(typeof CategoryList).toBe("function")
  })
})
