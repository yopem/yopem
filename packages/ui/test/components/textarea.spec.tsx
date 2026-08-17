import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/textarea"

describe("ui/components/textarea", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Textarea).toBeDefined()
    expect(mod.FieldPrimitive).toBeDefined()
  })
})
