import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/configuration-panel"

describe("apps/admin/components/products/configuration-panel", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ConfigurationPanel).toBeDefined()
  })
})
