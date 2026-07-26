import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/block-menu-kit"

describe("components/block-menu-kit", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
