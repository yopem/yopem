"use client"

import {
  type UseVirtualFloatingOptions,
  flip,
  getRangeBoundingClientRect,
  offset,
  useVirtualFloating,
} from "@platejs/floating"
import { insertMediaEmbed } from "@platejs/media"
import { CodeIcon, LinkIcon } from "lucide-react"
import { useEditorRef } from "platejs/react"
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import { cva } from "ui/utils"

const popoverVariants = cva(
  "bg-popover text-popover-foreground z-50 w-auto rounded-lg border p-1 shadow-lg/5 outline-hidden",
)

const inputVariants = cva(
  "placeholder:text-muted-foreground flex h-9 w-full rounded-md border-none bg-transparent px-2 py-1.5 text-base focus-visible:ring-transparent focus-visible:outline-none md:text-sm",
)

let openInsertValue = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export const EmbedInsertStore = {
  get: () => openInsertValue,
  set: (value: boolean) => {
    openInsertValue = value
    emit()
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useEmbedInsertOpen() {
  return useSyncExternalStore(
    EmbedInsertStore.subscribe,
    EmbedInsertStore.get,
    () => false,
  )
}

export function FloatingEmbedInsertToolbar() {
  const editor = useEditorRef()
  const openInsert = useEmbedInsertOpen()
  const [url, setUrl] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const floatingOptions: UseVirtualFloatingOptions = {
    getBoundingClientRect: () =>
      getRangeBoundingClientRect(editor, editor.selection),
    middleware: [
      offset(8),
      flip({
        fallbackPlacements: ["bottom-end", "top-start", "top-end"],
        padding: 12,
      }),
    ],
    placement: "bottom-start",
  }

  const { refs: floatingRefs, style } = useVirtualFloating(floatingOptions)

  useEffect(() => {
    floatingRefs.setFloating(containerRef.current)
  })

  const close = useCallback(() => {
    setUrl("")
    EmbedInsertStore.set(false)
    editor.tf.focus()
  }, [editor])

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()

      const trimmed = url.trim()

      if (!trimmed) return

      insertMediaEmbed(editor, { url: trimmed }, { select: true })
      setUrl("")
      EmbedInsertStore.set(false)
    },
    [editor, url],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        close()
      }
    },
    [close],
  )

  useEffect(() => {
    if (!openInsert) return

    function handleMouseDown(event: MouseEvent) {
      const container = containerRef.current

      if (!container) return
      if (container.contains(event.target as Node)) return

      close()
    }

    document.addEventListener("mousedown", handleMouseDown)

    return () => {
      document.removeEventListener("mousedown", handleMouseDown)
    }
  }, [openInsert, close])

  useEffect(() => {
    if (!openInsert) return

    let attempts = 0
    let timeout = 0
    let cancelled = false

    function focusInput() {
      if (cancelled) return

      const input = document.querySelector<HTMLInputElement>(
        "[data-embed-toolbar] input",
      )

      if (input) {
        input.focus()

        if (document.activeElement === input) return
      }
      if (attempts++ < 30) {
        timeout = window.setTimeout(focusInput, 16)
      }
    }

    timeout = window.setTimeout(focusInput, 50)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [openInsert])

  if (!openInsert) return null

  return (
    <div
      ref={containerRef}
      className={popoverVariants()}
      style={style}
      data-embed-toolbar
    >
      <form onSubmit={handleSubmit}>
        <div className="flex w-88 flex-col gap-2 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CodeIcon className="text-muted-foreground size-4" />
              <span className="text-sm font-medium">Embed</span>
            </div>
          </div>

          <div className="flex items-center rounded-md border px-2">
            <div className="text-muted-foreground flex items-center pr-2">
              <LinkIcon className="size-4" />
            </div>

            <input
              className={inputVariants()}
              placeholder="Paste the embed link..."
              value={url}
              onChange={(event) => setUrl(event.currentTarget.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <p className="text-muted-foreground text-xs">
            Paste a YouTube, Twitter/X, or Facebook link, then press Enter
          </p>
        </div>
      </form>
    </div>
  )
}
