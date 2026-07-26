import { describe, expect, test } from "vitest"

import * as mod from "editor/components/media-preview-node"

describe("components/media-preview-node", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
