import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/workflow-editor"

describe("apps/admin/components/products/workflow-editor", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.WorkflowEditor).toBeDefined()
  })
})
