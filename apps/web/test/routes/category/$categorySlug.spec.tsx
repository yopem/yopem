import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/category/$categorySlug"

describe("Category Route", () => {
  test("is defined", () => {
    expect(Route).toBeDefined()
  })
})
