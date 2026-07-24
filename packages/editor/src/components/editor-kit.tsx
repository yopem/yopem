"use client"

import { TrailingBlockPlugin } from "platejs"

import { AutoformatKit } from "editor/autoformat-kit"
import { BasicBlocksKit } from "editor/basic-blocks-kit"
import { BasicMarksKit } from "editor/basic-marks-kit"
import { BlockMenuKit } from "editor/block-menu-kit"
import { BlockPlaceholderKit } from "editor/block-placeholder-kit"
import { DndKit } from "editor/dnd-kit"
import { ExitBreakKit } from "editor/exit-break-kit"
import { FloatingToolbarKit } from "editor/floating-toolbar-kit"
import { IndentKit } from "editor/indent-kit"
import { LinkKit } from "editor/link-kit"
import { ListKit } from "editor/list-kit"
import { MediaKit } from "editor/media-kit"
import { SlashKit } from "editor/slash-kit"

import { BlockSelectionKit } from "./block-selection-kit"

export const EditorKit = [
  // Elements
  ...BasicBlocksKit,
  ...MediaKit,
  ...LinkKit,

  // Marks
  ...BasicMarksKit,

  // Block style
  ...ListKit,

  // Selection + drag-and-drop
  ...BlockMenuKit,
  ...BlockSelectionKit,
  ...DndKit,

  // Indentation
  ...IndentKit,

  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Media placeholders + floating toolbar
  ...BlockPlaceholderKit,
  ...FloatingToolbarKit,
]
