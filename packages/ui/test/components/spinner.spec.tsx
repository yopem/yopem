import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/spinner"

describe("ui/components/spinner", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Spinner).toBeDefined()
  })
})
