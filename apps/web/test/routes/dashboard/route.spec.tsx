import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/dashboard/route"

describe("Dashboard Layout Route", () => {
  test("is defined", () => {
    expect(Route).toBeDefined()
  })
})
