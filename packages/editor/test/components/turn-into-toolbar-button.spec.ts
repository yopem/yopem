import { describe, expect, test } from "vitest"

import * as mod from "editor/components/turn-into-toolbar-button"

describe("components/turn-into-toolbar-button", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
