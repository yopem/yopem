import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/media-file-node"

describe("editor/media-file-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.FileElement).toBeDefined()
  })
})
