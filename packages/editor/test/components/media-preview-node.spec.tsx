import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/media-preview-node"

describe("editor/media-preview-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.MediaPreviewDialog).toBeDefined()
  })
})
