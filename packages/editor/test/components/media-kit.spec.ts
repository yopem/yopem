import { describe, expect, test } from "vitest"

import * as mod from "editor/components/media-kit"

describe("components/media-kit", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
