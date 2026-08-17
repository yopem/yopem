import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/media-image-node"

describe("editor/media-image-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ImageElement).toBeDefined()
  })
})
