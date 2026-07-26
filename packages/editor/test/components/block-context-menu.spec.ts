import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/block-context-menu"

describe("components/block-context-menu", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
