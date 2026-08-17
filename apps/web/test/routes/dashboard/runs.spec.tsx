import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/dashboard/runs"

describe("Dashboard Runs Route", () => {
  test("is defined", () => {
    expect(Route).toBeDefined()
  })
})
