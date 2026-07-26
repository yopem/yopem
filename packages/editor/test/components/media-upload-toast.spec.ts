import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/components/media-upload-toast"

describe("components/media-upload-toast", () => {
  test("exports at least one value", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
