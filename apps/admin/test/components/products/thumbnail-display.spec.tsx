import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/thumbnail-display"

describe("apps/admin/components/products/thumbnail-display", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ThumbnailDisplay).toBeDefined()
  })
})
