import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/block-list-elements"

describe("editor/block-list-elements", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.IconList).toBeDefined()
  })
})
