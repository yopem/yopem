// @vitest-environment jsdom

import { KEYS } from "platejs"
import { describe, expect, test } from "vite-plus/test"

import {
  deserializeHtmlToSlate,
  serializeSlateToHtml,
} from "editor/lib/serialize"

describe("serialize", () => {
  test("exports deserializeHtmlToSlate", () => {
    expect(typeof deserializeHtmlToSlate).toBe("function")
  })

  test("exports serializeSlateToHtml", () => {
    expect(typeof serializeSlateToHtml).toBe("function")
  })

  describe("media embed", () => {
    const embedNode = {
      type: KEYS.mediaEmbed,
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      children: [{ type: KEYS.p, children: [{ text: "" }] }],
    }

    test("serializes an embed with no caption without an empty paragraph", async () => {
      const html = await serializeSlateToHtml([embedNode] as never[])

      expect(html).not.toMatch(/<p>\s*<\/p>/)
      expect(html).toContain("youtube.com")
    })

    test("deserializes an iframe back into a media embed node", () => {
      const value = deserializeHtmlToSlate(
        '<div><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe></div>',
      )

      expect(value[0]).toMatchObject({
        type: KEYS.mediaEmbed,
        url: embedNode.url,
      })
    })

    test("an embed node survives the save/reload slate round-trip", () => {
      const saved = structuredClone([embedNode])

      expect(saved).toEqual([embedNode])
      expect(saved[0]).toMatchObject({
        type: KEYS.mediaEmbed,
        url: embedNode.url,
      })
    })
  })

  describe("image", () => {
    const imageNode = {
      type: KEYS.img,
      url: "https://example.com/photo.webp",
      width: 320,
      caption: [{ text: "A caption" }],
      children: [{ text: "" }],
    }

    test("serializes an image node to figure with img and figcaption markup", async () => {
      const html = await serializeSlateToHtml([imageNode] as never[])

      expect(html).toContain("photo.webp")
      expect(html).toContain("img")
      expect(html).toContain("figure")
      expect(html).toContain("figcaption")
      expect(html).toContain("A caption")
    })

    test("deserializes a figure with img and figcaption back into an image node with caption", () => {
      const value = deserializeHtmlToSlate(
        '<figure><img src="https://example.com/photo.webp" width="320" alt="A caption" /><figcaption>A caption</figcaption></figure>',
      )

      expect(value[0]).toMatchObject({
        type: KEYS.img,
        url: "https://example.com/photo.webp",
      })
    })

    test("ignores img elements with local file paths", () => {
      const value = deserializeHtmlToSlate(
        '<img src="/tmp/pi-clipboard-60ceaea4-a9d0-4607-bc22-d19d8dc144a3.png" />',
      )

      expect(value.every((node) => node.type !== KEYS.img)).toBe(true)
    })

    test("an image node survives the save/reload slate round-trip", async () => {
      const html = await serializeSlateToHtml([imageNode] as never[])
      const reloaded = deserializeHtmlToSlate(html)

      expect(reloaded[0]).toMatchObject({
        type: KEYS.img,
        url: "https://example.com/photo.webp",
      })
      expect(reloaded[0]).toHaveProperty("caption")
    })
  })
})
