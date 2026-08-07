import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/delete-dialog"

describe("apps/admin/components/delete-dialog", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.DeleteDialog).toBeDefined()
  })
})
