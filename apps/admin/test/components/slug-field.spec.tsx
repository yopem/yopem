import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/slug-field"

describe("apps/admin/components/slug-field", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.SlugField).toBeDefined()
  })
})
