import { describe, expect, test } from "vitest"

import * as mod from "editor/components/drag-handle"

describe("components/drag-handle", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
