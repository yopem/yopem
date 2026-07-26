import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/block-selection"

describe("components/block-selection", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
