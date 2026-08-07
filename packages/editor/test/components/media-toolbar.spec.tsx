import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/media-toolbar"

describe("editor/media-toolbar", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.MediaToolbar).toBeDefined()
  })
})
