import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/link-toolbar"

describe("components/link-toolbar", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
