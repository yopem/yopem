import { describe, expect, test } from "vitest"

import * as mod from "editor/components/editor"

describe("components/editor", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
