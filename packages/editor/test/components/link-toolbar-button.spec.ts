import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/link-toolbar-button"

describe("components/link-toolbar-button", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
