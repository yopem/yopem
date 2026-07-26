import { describe, expect, test } from "vitest"

import * as mod from "editor/components/draggable-gutter"

describe("components/draggable-gutter", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
