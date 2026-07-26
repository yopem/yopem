import { describe, expect, test } from "vitest"

import * as mod from "editor/components/list-kit"

describe("components/list-kit", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
