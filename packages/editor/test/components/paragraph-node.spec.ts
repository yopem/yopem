import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/paragraph-node"

describe("components/paragraph-node", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
