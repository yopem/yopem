import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/assets/asset-library"

describe("apps/admin/components/assets/asset-library", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.AssetLibrary).toBeDefined()
  })
})
