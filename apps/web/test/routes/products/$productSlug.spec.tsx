import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/products/$productSlug"

describe("Product Detail Route", () => {
  test("is defined", () => {
    expect(Route).toBeDefined()
  })
})
