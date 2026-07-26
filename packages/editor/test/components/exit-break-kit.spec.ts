import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/exit-break-kit"

describe("components/exit-break-kit", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
