import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/dashboard/index"

describe("Dashboard Index Route", () => {
  test("is defined", () => {
    expect(Route).toBeDefined()
  })
})
