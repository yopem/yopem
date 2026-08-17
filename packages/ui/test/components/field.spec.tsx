import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/field"

describe("ui/components/field", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Field).toBeDefined()
    expect(mod.FieldLabel).toBeDefined()
    expect(mod.FieldItem).toBeDefined()
    expect(mod.FieldDescription).toBeDefined()
    expect(mod.FieldError).toBeDefined()
  })
})
