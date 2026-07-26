import { describe, expect, test } from "vitest"

import * as mod from "editor/components/media-image-node"

describe("components/media-image-node", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
