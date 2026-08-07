import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/layout/global-search"

describe("apps/admin/components/layout/global-search", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.GlobalSearch).toBeDefined()
  })
})
