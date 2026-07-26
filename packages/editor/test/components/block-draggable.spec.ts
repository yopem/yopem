import { describe, expect, test } from "vitest"

import * as mod from "editor/components/block-draggable"

describe("components/block-draggable", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
