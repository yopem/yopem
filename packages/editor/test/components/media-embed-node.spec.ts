import { describe, expect, test } from "vitest"

import * as mod from "editor/components/media-embed-node"

describe("components/media-embed-node", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
