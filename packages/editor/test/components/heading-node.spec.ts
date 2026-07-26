import { describe, expect, test } from "vitest"

import * as mod from "editor/components/heading-node"

describe("components/heading-node", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
