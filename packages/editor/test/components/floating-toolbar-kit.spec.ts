import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/floating-toolbar-kit"

describe("components/floating-toolbar-kit", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
