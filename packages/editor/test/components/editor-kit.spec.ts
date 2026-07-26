import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/editor-kit"

describe("components/editor-kit", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
