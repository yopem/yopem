import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/dashboard/profile"

describe("Dashboard Profile Route", () => {
  test("is defined", () => {
    expect(Route).toBeDefined()
  })
})
