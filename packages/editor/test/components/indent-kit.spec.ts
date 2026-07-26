import { describe, expect, test } from "vitest"

import * as mod from "editor/components/indent-kit"

describe("components/indent-kit", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
