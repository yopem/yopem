import { describe, expect, test } from "vitest"

import * as mod from "editor/components/blockquote-node"

describe("components/blockquote-node", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
