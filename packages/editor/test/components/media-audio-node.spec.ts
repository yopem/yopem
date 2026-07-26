import { describe, expect, test } from "vitest"

import * as mod from "editor/components/media-audio-node"

describe("components/media-audio-node", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
