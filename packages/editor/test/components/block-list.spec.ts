import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/block-list"

describe("components/block-list", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
