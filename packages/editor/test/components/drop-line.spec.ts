import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/drop-line"

describe("components/drop-line", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
