import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/dashboard/products"

describe("Dashboard Products Route", () => {
  test("is defined", () => {
    expect(Route).toBeDefined()
  })
})
