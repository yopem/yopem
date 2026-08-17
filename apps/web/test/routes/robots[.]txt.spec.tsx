import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/robots[.]txt"

describe("Robots Route", () => {
  test("is defined", () => {
    expect(Route).toBeDefined()
  })
})
