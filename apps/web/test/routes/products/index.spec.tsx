import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/products/index"

describe("Products Catalog Route", () => {
  test("is defined", () => {
    expect(Route).toBeDefined()
  })
})
