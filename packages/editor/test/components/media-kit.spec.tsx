import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/media-kit"

describe("editor/media-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.MediaKit).toBeDefined()
  })
})
