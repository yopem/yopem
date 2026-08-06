"use client"

import type { PlateEditor } from "platejs/react"

import { LinkPlugin } from "@platejs/link/react"
import {
  insertAudioPlaceholder,
  insertFilePlaceholder,
  insertMedia,
  insertVideoPlaceholder,
} from "@platejs/media"
import {
  type NodeEntry,
  type Path,
  type TElement,
  getEditorPlugin,
  KEYS,
  PathApi,
} from "platejs"

import { EmbedInsertStore } from "editor/floating-embed-toolbar"

function insertList(editor: PlateEditor, type: string) {
  editor.tf.insertNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    { select: true },
  )
}

function createBlockquote(editor: PlateEditor) {
  return {
    children: [editor.api.create.block({ type: KEYS.p })],
    type: KEYS.blockquote,
  }
}

function selectBlockquoteStart(editor: PlateEditor, path: Path) {
  const start = editor.api.start(path.concat([0]))

  if (start) {
    editor.tf.select(start)
  }
}

const insertBlockMap: Record<
  string,
  (editor: PlateEditor, type: string) => void
> = {
  [KEYS.ol]: insertList,
  [KEYS.ul]: insertList,
  [KEYS.audio]: (editor) => insertAudioPlaceholder(editor, { select: true }),
  [KEYS.file]: (editor) => insertFilePlaceholder(editor, { select: true }),
  [KEYS.img]: (editor) =>
    void insertMedia(editor, {
      select: true,
      type: KEYS.img,
    }),
  [KEYS.mediaEmbed]: (editor) =>
    void insertMedia(editor, {
      select: true,
      type: KEYS.mediaEmbed,
    }),
  [KEYS.video]: (editor) => insertVideoPlaceholder(editor, { select: true }),
}

const insertInlineMap: Record<
  string,
  (editor: PlateEditor, type: string) => void
> = {
  [KEYS.link]: (editor) => {
    const { api, setOption } = getEditorPlugin(editor, LinkPlugin)

    setOption("mode", "insert")
    setOption("text", editor.api.string(editor.selection))
    api.floatingLink.show("insert", editor.id)
  },
  [KEYS.mediaEmbed]: () => {
    EmbedInsertStore.set(true)
  },
}

interface InsertBlockOptions {
  upsert?: boolean
}

export function insertBlock(
  editor: PlateEditor,
  type: string,
  options: InsertBlockOptions = {},
) {
  const { upsert = false } = options

  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block()

    if (!block) return

    const [currentNode, path] = block
    const isCurrentBlockEmpty = editor.api.isEmpty(currentNode)
    const currentBlockType = getBlockType(currentNode)

    const isSameBlockType = type === currentBlockType

    if (upsert && isCurrentBlockEmpty && isSameBlockType) {
      return
    }

    if (type === KEYS.blockquote) {
      const insertPath = PathApi.next(path)

      editor.tf.insertNodes(createBlockquote(editor), { at: insertPath })

      if (!isSameBlockType && isCurrentBlockEmpty) {
        editor.tf.removeNodes({ at: path })
      }

      selectBlockquoteStart(
        editor,
        isCurrentBlockEmpty && !isSameBlockType ? path : insertPath,
      )

      return
    }
    if (type in insertBlockMap) {
      insertBlockMap[type](editor, type)
    } else {
      editor.tf.insertNodes(editor.api.create.block({ type }), {
        at: PathApi.next(path),
        select: true,
      })
    }

    if (!isSameBlockType) {
      editor.tf.removeNodes({ previousEmptyBlock: true })
    }
  })
}

export function insertInlineElement(editor: PlateEditor, type: string) {
  if (insertInlineMap[type]) {
    insertInlineMap[type](editor, type)
  }
}

function setList(
  editor: PlateEditor,
  type: string,
  entry: NodeEntry<TElement>,
) {
  editor.tf.setNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    {
      at: entry[1],
    },
  )
}

const setBlockMap: Record<
  string,
  (editor: PlateEditor, type: string, entry: NodeEntry<TElement>) => void
> = {
  [KEYS.ol]: setList,
  [KEYS.ul]: setList,
}

export function setBlockType(
  editor: PlateEditor,
  type: string,
  { at }: { at?: Path } = {},
) {
  editor.tf.withoutNormalizing(() => {
    if (type === KEYS.blockquote) {
      const target = at ?? editor.selection

      if (!target || editor.api.some({ at: target, match: { type } })) {
        return
      }

      editor.tf.toggleBlock(type, {
        ...(at ? { at } : {}),
        wrap: true,
      })

      return
    }

    function setEntry(entry: NodeEntry<TElement>) {
      const [node, path] = entry

      if (node[KEYS.listType]) {
        editor.tf.unsetNodes([KEYS.listType, "indent"], { at: path })
      }
      if (type in setBlockMap) {
        return setBlockMap[type](editor, type, entry)
      }
      if (node.type !== type) {
        editor.tf.setNodes({ type }, { at: path })
      }
    }

    if (at) {
      const entry = editor.api.node<TElement>(at)

      if (entry) {
        setEntry(entry)

        return
      }
    }

    const entries = editor.api.blocks({ mode: "lowest" })

    entries.forEach((entry) => {
      setEntry(entry)
    })
  })
}

export function getBlockType(block: TElement) {
  if (block[KEYS.listType]) {
    if (block[KEYS.listType] === KEYS.ol) {
      return KEYS.ol
    }

    return KEYS.ul
  }

  return block.type
}
