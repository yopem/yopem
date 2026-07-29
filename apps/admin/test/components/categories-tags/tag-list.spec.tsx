import { describe, expect, test } from "vite-plus/test"

import { TagList } from "@/components/categories-tags/tag-list"

describe("TagList", () => {
  test("is a React component", () => {
    expect(typeof TagList).toBe("function")
  })
})
