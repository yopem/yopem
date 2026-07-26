import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/floating-toolbar"

describe("components/floating-toolbar", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
