import type { TImageElement } from "platejs"

import {
  BaseBlockquotePlugin,
  BaseBoldPlugin,
  BaseCodePlugin,
  BaseH1Plugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseH4Plugin,
  BaseH5Plugin,
  BaseH6Plugin,
  BaseHighlightPlugin,
  BaseHorizontalRulePlugin,
  BaseItalicPlugin,
  BaseKbdPlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseUnderlinePlugin,
} from "@platejs/basic-nodes"
import { BaseCaptionPlugin } from "@platejs/caption"
import { BaseIndentPlugin } from "@platejs/indent"
import { BaseLinkPlugin } from "@platejs/link"
import { BaseListPlugin } from "@platejs/list"
import { BaseImagePlugin, BaseMediaEmbedPlugin } from "@platejs/media"
import { BaseParagraphPlugin } from "platejs"
import { createElement } from "react"

import { isRemoteImageSrc } from "./is-remote-image-src"
import { parseImageHtmlElement } from "./parse-image-html"

function getCaptionText(element: TImageElement): string {
  return Array.isArray(element.caption)
    ? element.caption.map((node) => ("text" in node ? node.text : "")).join("")
    : ""
}

function ImageStaticElement({ element }: { element: TImageElement }) {
  const caption = getCaptionText(element)

  return createElement(
    "figure",
    null,
    createElement("img", {
      alt: caption,
      "data-caption": caption || undefined,
      src: element.url,
      width: element.width,
    }),
    caption ? createElement("figcaption", null, caption) : null,
  )
}

export const SerializeKit = [
  BaseParagraphPlugin,
  BaseH1Plugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseH4Plugin,
  BaseH5Plugin,
  BaseH6Plugin,
  BaseBlockquotePlugin,
  BaseHorizontalRulePlugin,
  BaseBoldPlugin,
  BaseItalicPlugin,
  BaseUnderlinePlugin,
  BaseCodePlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseHighlightPlugin,
  BaseKbdPlugin,
  BaseLinkPlugin,
  BaseIndentPlugin,
  BaseListPlugin,
  BaseImagePlugin.configure({
    node: {
      component: ImageStaticElement,
    },
    parsers: {
      html: {
        deserializer: {
          query: ({ element }) => {
            const img =
              element.nodeName === "FIGURE"
                ? element.querySelector("img")
                : element
            const src = img?.getAttribute("src")
            return src ? isRemoteImageSrc(src) : false
          },
          rules: [{ validNodeName: "IMG" }, { validNodeName: "FIGURE" }],
          parse: ({ element, type }) => {
            const parsed = parseImageHtmlElement(element, type)
            return parsed ? { ...parsed, children: [{ text: "" }] } : undefined
          },
        },
      },
    },
  }),
  BaseCaptionPlugin,
  BaseMediaEmbedPlugin,
]
