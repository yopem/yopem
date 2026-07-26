import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/hr-node"

describe("components/hr-node", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
