import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/upload-tab"

describe("apps/admin/components/products/upload-tab", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.UploadTab).toBeDefined()
  })
})
