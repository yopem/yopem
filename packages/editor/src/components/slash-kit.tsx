"use client"

import { SlashInputPlugin, SlashPlugin } from "@platejs/slash-command/react"

import { SlashInputElement } from "editor/slash-node"

export const SlashKit = [
  SlashPlugin,
  SlashInputPlugin.withComponent(SlashInputElement),
]
