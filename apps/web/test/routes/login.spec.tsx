import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/login"

describe("Login Route", () => {
  test("is defined", () => {
    expect(Route).toBeDefined()
  })
})
