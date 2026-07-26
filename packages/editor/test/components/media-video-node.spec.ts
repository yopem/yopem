import { describe, expect, test } from "vitest"

import * as mod from "editor/components/media-video-node"

describe("components/media-video-node", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
