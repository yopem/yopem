import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/link-kit"

describe("components/link-kit", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
