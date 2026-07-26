import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/media-toolbar"

describe("components/media-toolbar", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
