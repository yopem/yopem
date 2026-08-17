import { describe, expect, test } from "vite-plus/test"

import { getRouter } from "@/router"

describe("apps/admin/router", () => {
  test("exports getRouter function", () => {
    expect(typeof getRouter).toBe("function")
  })
})
