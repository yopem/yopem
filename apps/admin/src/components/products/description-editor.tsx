"use client"

import { useCallback, useEffect, useRef } from "react"

import type { TElement } from "editor"
import { Editor, EditorContainer, Plate, usePlateEditor } from "editor"
import { EditorKit } from "editor/editor-kit"
import { FloatingToolbar } from "editor/floating-toolbar"
import { FloatingToolbarButtons } from "editor/floating-toolbar-buttons"
import { serializeSlateToHtml } from "editor/serialize"

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
  const editor = usePlateEditor(
    {
      plugins: EditorKit,
      value: initialValue,
    },
    [],
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback(
    ({ value }: { value: TElement[] }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void serializeSlateToHtml(value)
          .then((html) => onChange(value, html))
          .catch((error: unknown) => {
            console.error("Failed to serialize description to HTML:", error)
            onChange(value, "")
          })
      }, 300)
    },
    [onChange],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleBlur = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    const value = editor?.children ?? []
    if (value.length > 0) {
      void serializeSlateToHtml(value)
        .then((html) => onChange(value, html))
        .catch((error: unknown) => {
          console.error("Failed to serialize description on blur:", error)
        })
    }
    onBlur?.()
  }, [editor, onChange, onBlur])

  if (!editor) return null

  return (
    <Plate editor={editor} onChange={handleChange}>
      <EditorContainer variant="default" onBlurCapture={handleBlur}>
        <Editor variant="default" />
        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      </EditorContainer>
    </Plate>
  )
}
