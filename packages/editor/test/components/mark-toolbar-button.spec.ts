import { describe, expect, test } from "vitest"

import * as mod from "editor/components/mark-toolbar-button"

describe("components/mark-toolbar-button", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
