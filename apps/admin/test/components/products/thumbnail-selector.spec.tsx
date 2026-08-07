import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/thumbnail-selector"

describe("apps/admin/components/products/thumbnail-selector", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ThumbnailSelector).toBeDefined()
  })
})
