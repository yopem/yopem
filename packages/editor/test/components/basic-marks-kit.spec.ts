import { describe, expect, test } from "vitest"

import * as mod from "editor/components/basic-marks-kit"

describe("components/basic-marks-kit", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
