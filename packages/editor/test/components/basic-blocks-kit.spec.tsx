import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/basic-blocks-kit"

describe("editor/basic-blocks-kit", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.BasicBlocksKit).toBeDefined()
  })
})
