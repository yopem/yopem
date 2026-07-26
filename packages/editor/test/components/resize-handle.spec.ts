import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/resize-handle"

describe("components/resize-handle", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
