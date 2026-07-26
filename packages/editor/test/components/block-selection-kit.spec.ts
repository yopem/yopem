import { describe, expect, test } from "vitest"

import * as mod from "editor/components/block-selection-kit"

describe("components/block-selection-kit", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
