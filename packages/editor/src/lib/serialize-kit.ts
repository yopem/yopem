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
import { BaseIndentPlugin } from "@platejs/indent"
import { BaseLinkPlugin } from "@platejs/link"
import { BaseListPlugin } from "@platejs/list"
import { BaseImagePlugin, BaseMediaEmbedPlugin } from "@platejs/media"
import { BaseParagraphPlugin } from "platejs"
import { createElement } from "react"

function ImageStaticElement({ element }: { element: TImageElement }) {
  const caption = Array.isArray(element.caption)
    ? element.caption.map((node) => ("text" in node ? node.text : "")).join("")
    : ""

  return createElement("img", {
    alt: caption,
    src: element.url,
    width: element.width,
  })
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
  }),
  BaseMediaEmbedPlugin,
]
