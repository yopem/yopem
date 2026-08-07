import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/link-toolbar-button"

describe("editor/link-toolbar-button", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.LinkToolbarButton).toBeDefined()
  })
})
