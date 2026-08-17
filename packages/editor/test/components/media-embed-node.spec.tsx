import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/media-embed-node"

describe("editor/media-embed-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.parseFacebookUrl).toBeDefined()
    expect(mod.MediaEmbedElement).toBeDefined()
  })
})
