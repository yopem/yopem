import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/media-video-node"

describe("editor/media-video-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.VideoElement).toBeDefined()
  })
})
