import { describe, expect, test } from "vitest"

import * as mod from "editor/components/kbd-node"

describe("components/kbd-node", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
