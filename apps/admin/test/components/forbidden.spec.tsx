import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/forbidden"

describe("apps/admin/components/forbidden", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Forbidden).toBeDefined()
  })
})
