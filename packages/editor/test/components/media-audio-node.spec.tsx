import { describe, expect, test } from "vite-plus/test"

import * as mod from "editor/media-audio-node"

describe("editor/media-audio-node", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.AudioElement).toBeDefined()
  })
})
