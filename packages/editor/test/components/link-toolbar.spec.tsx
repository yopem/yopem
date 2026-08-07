import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/link-toolbar"

describe("editor/link-toolbar", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.LinkFloatingToolbar).toBeDefined()
  })
})
