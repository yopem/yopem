"use client"

import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  VideoPlugin,
} from "@platejs/media/react"

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
]
