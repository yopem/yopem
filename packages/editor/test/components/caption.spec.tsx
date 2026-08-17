import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/caption"

describe("editor/caption", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Caption).toBeDefined()
    expect(mod.CaptionTextarea).toBeDefined()
    expect(mod.CaptionButton).toBeDefined()
  })
})
