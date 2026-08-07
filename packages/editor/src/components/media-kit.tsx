"use client"

import { CaptionPlugin } from "@platejs/caption/react"
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  VideoPlugin,
} from "@platejs/media/react"
import { KEYS } from "platejs"
import { createPlatePlugin } from "platejs/react"

import { FloatingEmbedInsertToolbar } from "editor/floating-embed-toolbar"
import { isRemoteImageSrc } from "editor/lib/is-remote-image-src"
import { parseImageHtmlElement } from "editor/lib/parse-image-html"
import { AudioElement } from "editor/media-audio-node"
import { MediaEmbedElement } from "editor/media-embed-node"
import { FileElement } from "editor/media-file-node"
import { ImageElement } from "editor/media-image-node"
import { VideoElement } from "editor/media-video-node"

export const MediaKit = [
  ImagePlugin.configure({
    options: {
      disableUploadInsert: true,
    },
    node: {
      component: ImageElement,
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
  FilePlugin.configure({
    node: {
      component: FileElement,
    },
  }),
  VideoPlugin.configure({
    node: {
      component: VideoElement,
    },
  }),
  AudioPlugin.configure({
    node: {
      component: AudioElement,
    },
  }),
  MediaEmbedPlugin.configure({
    node: {
      component: MediaEmbedElement,
    },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
  createPlatePlugin({
    key: "floating-embed-toolbar",
    render: {
      afterEditable: () => <FloatingEmbedInsertToolbar />,
    },
  }),
]
