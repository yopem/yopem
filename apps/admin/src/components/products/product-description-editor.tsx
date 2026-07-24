"use client"

import { ImageIcon } from "lucide-react"
import { usePlateEditor } from "platejs/react"
import { Plate } from "platejs/react"
import { useCallback, useEffect, useRef, useState } from "react"

import { EditorContainer, Editor } from "editor"
import { EditorKit } from "editor/editor-kit"
import { serializeSlateToHtml, deserializeHtmlToSlate } from "editor/serialize"
import { Button } from "ui/button"
import { Field, FieldLabel } from "ui/field"

import MediaLibraryDialog from "./media-library-dialog"

interface ProductDescriptionEditorProps {
  value: string
  onChange: (value: string) => void
}

const ProductDescriptionEditor = ({
  value,
  onChange,
}: ProductDescriptionEditorProps) => {
  const editor = usePlateEditor({ plugins: EditorKit })
  const lastHtmlRef = useRef<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (value !== lastHtmlRef.current) {
      editor.tf.setValue(deserializeHtmlToSlate(value))
      lastHtmlRef.current = value
    }
  }, [value, editor])

  const handleValueChange = useCallback(
    async ({ editor: currentEditor }: { editor: typeof editor }) => {
      const html = await serializeSlateToHtml(currentEditor.children)
      const textContent = html.replace(/<[^>]*>/g, "").trim()
      if (textContent.length === 0) {
        lastHtmlRef.current = ""
        onChange("")
      } else {
        lastHtmlRef.current = html
        onChange(html)
      }
    },
    [onChange],
  )

  return (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel>Product Description</FieldLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          <ImageIcon className="mr-2 size-4" />
          Media library
        </Button>
      </div>

      {mounted ? (
        <Plate editor={editor} onValueChange={handleValueChange}>
          <EditorContainer variant="compact" className="min-h-[320px]">
            <Editor
              variant="compact"
              placeholder="Enter product description..."
            />
          </EditorContainer>
        </Plate>
      ) : (
        <div className="border-input min-h-[320px] rounded-md border px-3 py-2 text-sm text-gray-400">
          Loading editor...
        </div>
      )}

      <MediaLibraryDialog
        editor={editor}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Field>
  )
}

export default ProductDescriptionEditor
