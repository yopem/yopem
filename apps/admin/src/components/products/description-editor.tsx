"use client"

import type { TElement } from "platejs"

import { Plate, usePlateEditor } from "platejs/react"
import { useCallback, useEffect, useRef, useState } from "react"

import { Editor, EditorContainer } from "editor/editor"
import { EditorKit } from "editor/editor-kit"
import { FloatingToolbar } from "editor/floating-toolbar"
import { FloatingToolbarButtons } from "editor/floating-toolbar-buttons"
import { ImagePickerPlugin } from "editor/image-picker-kit"
import { serializeSlateToHtml } from "editor/serialize"

import {
  ImageAssetPicker,
  type ImageAsset,
} from "@/components/assets/image-asset-picker"

interface DescriptionEditorProps {
  initialValue: TElement[]
  onChange: (value: TElement[], html: string) => void
  onBlur?: () => void
}

export function DescriptionEditor({
  initialValue,
  onChange,
  onBlur,
}: DescriptionEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingResolve, setPendingResolve] = useState<
    ((url: string | undefined) => void) | null
  >(null)

  const imagePicker = useCallback(
    () =>
      new Promise<string | undefined>((resolve) => {
        setPendingResolve(() => resolve)
        setPickerOpen(true)
      }),
    [],
  )

  const handleSelectAsset = useCallback(
    (asset: ImageAsset) => {
      pendingResolve?.(asset.url)
      setPendingResolve(null)
      setPickerOpen(false)
    },
    [pendingResolve],
  )

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setPickerOpen(open)
      if (!open && pendingResolve) {
        pendingResolve(undefined)
        setPendingResolve(null)
      }
    },
    [pendingResolve],
  )

  const editor = usePlateEditor(
    {
      plugins: [
        ...EditorKit,
        ImagePickerPlugin.configure({
          options: { imagePicker },
        }),
      ],
      value: initialValue,
    },
    [imagePicker],
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChangeRef = useRef(onChange)
  const onBlurRef = useRef(onBlur)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onBlurRef.current = onBlur
  }, [onBlur])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleChange = useCallback(({ value }: { value: TElement[] }) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void serializeSlateToHtml(value)
        .then((html) => onChangeRef.current(value, html))
        .catch((error: unknown) => {
          console.error("Failed to serialize description to HTML:", error)
          onChangeRef.current(value, "")
        })
    }, 300)
  }, [])

  const handleBlur = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    const value = editor?.children ?? []
    if (value.length > 0) {
      void serializeSlateToHtml(value)
        .then((html) => onChangeRef.current(value, html))
        .catch((error: unknown) => {
          console.error("Failed to serialize description on blur:", error)
        })
    }
    onBlurRef.current?.()
  }, [editor])

  if (!editor) return null

  return (
    <>
      <Plate editor={editor} onChange={handleChange}>
        <EditorContainer
          variant="default"
          onBlurCapture={handleBlur}
          className="border-input bg-background dark:bg-input/32 focus-within:border-ring focus-within:ring-ring/24 min-h-80 resize-y overflow-y-auto rounded-lg border shadow-xs/5 transition-shadow focus-within:ring-[3px] [&_.slate-selection-area]:border-none [&_.slate-selection-area]:bg-transparent"
        >
          <Editor
            variant="default"
            placeholder="Type something..."
            className="px-4 pt-4 pb-20 sm:px-4 sm:pl-4"
          />
          <FloatingToolbar>
            <FloatingToolbarButtons />
          </FloatingToolbar>
        </EditorContainer>
      </Plate>
      <ImageAssetPicker
        open={pickerOpen}
        onOpenChange={handleOpenChange}
        onSelect={handleSelectAsset}
        title="Insert Image"
        description="Choose an image from your library or upload a new one"
      />
    </>
  )
}
