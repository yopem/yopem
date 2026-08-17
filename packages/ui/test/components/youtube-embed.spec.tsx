import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/youtube-embed"

describe("ui/components/youtube-embed", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.YouTubeEmbed).toBeDefined()
  })
})
