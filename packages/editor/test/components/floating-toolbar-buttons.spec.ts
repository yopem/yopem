import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/floating-toolbar-buttons"

describe("components/floating-toolbar-buttons", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
