import { describe, expect, test } from "vitest"

import * as mod from "editor/components/code-node"

describe("components/code-node", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
