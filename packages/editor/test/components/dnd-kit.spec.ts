import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/dnd-kit"

describe("components/dnd-kit", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
