import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/basic-marks-kit"

describe("editor/basic-marks-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.BasicMarksKit).toBeDefined()
  })
})
