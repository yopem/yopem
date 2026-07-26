import { describe, expect, test } from "vitest"

import * as mod from "editor/components/transform"

describe("components/transform", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
