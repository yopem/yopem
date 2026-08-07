import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/routes/(admin-console)/products/index"

describe("apps/admin/routes/(admin-console)/products/index", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Route).toBeDefined()
  })
})
