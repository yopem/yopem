import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/index"

describe("Index Route", () => {
  test("is defined", () => {
    expect(Route).toBeDefined()
  })
})
