import { describe, expect, test } from "vitest"

import * as mod from "editor/components/inline-combobox"

describe("components/inline-combobox", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
