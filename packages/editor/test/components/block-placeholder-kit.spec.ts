import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/block-placeholder-kit"

describe("components/block-placeholder-kit", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
