import { describe, expect, test } from "vite-plus/test"

import { parseFacebookUrl } from "editor/media-embed-node"

describe("parseFacebookUrl", () => {
  test("parses a facebook post URL", () => {
    const url = "https://www.facebook.com/acme/posts/123456789"

    expect(parseFacebookUrl(url)).toEqual({
      provider: "facebook",
      sourceKind: "url",
      url,
    })
  })

  test("parses a facebook video URL", () => {
    const url = "https://www.facebook.com/acme/videos/987654321"

    expect(parseFacebookUrl(url)).toEqual({
      provider: "facebook",
      sourceKind: "url",
      url,
    })
  })

  test("parses a facebook watch URL", () => {
    const url = "https://www.facebook.com/watch/?v=123456789"

    expect(parseFacebookUrl(url)).toEqual({
      provider: "facebook",
      sourceKind: "url",
      url,
    })
  })

  test("parses a permalink.php share URL", () => {
    const url = "https://www.facebook.com/permalink.php?story_fbid=123&id=456"

    expect(parseFacebookUrl(url)).toEqual({
      provider: "facebook",
      sourceKind: "url",
      url,
    })
  })

  test("parses a story.php share URL", () => {
    const url = "https://www.facebook.com/story.php?story_fbid=123"

    expect(parseFacebookUrl(url)).toEqual({
      provider: "facebook",
      sourceKind: "url",
      url,
    })
  })

  test("parses a photo.php share URL", () => {
    const url = "https://www.facebook.com/photo.php?fbid=123&set=a.456"

    expect(parseFacebookUrl(url)).toEqual({
      provider: "facebook",
      sourceKind: "url",
      url,
    })
  })

  test("parses a video.php share URL", () => {
    const url = "https://www.facebook.com/video.php?v=123456789"

    expect(parseFacebookUrl(url)).toEqual({
      provider: "facebook",
      sourceKind: "url",
      url,
    })
  })

  test("trims trailing slash", () => {
    expect(
      parseFacebookUrl("https://www.facebook.com/acme/posts/123/")?.url,
    ).toBe("https://www.facebook.com/acme/posts/123")
  })

  test("returns undefined for a non-facebook URL", () => {
    expect(parseFacebookUrl("https://example.com/posts/123")).toBeUndefined()
  })

  test("returns undefined for a plain facebook profile URL", () => {
    expect(parseFacebookUrl("https://www.facebook.com/acme")).toBeUndefined()
  })
})
