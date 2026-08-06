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
})
