import { describe, expect, test } from "vite-plus/test"

import { YouTubeEmbed } from "ui/components/youtube-embed"

describe("youtube-embed", () => {
  test("YouTubeEmbed is exported", () => {
    expect(YouTubeEmbed).toBeDefined()
  })
})
