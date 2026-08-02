import type { TElement } from "platejs"

import { createStaticEditor, serializeHtml } from "@platejs/core/static"
import { createSlateEditor, deserializeHtml, KEYS } from "platejs"

import { EditorKit } from "editor/editor-kit"

const EMPTY_VALUE: TElement[] = [{ type: KEYS.p, children: [{ text: "" }] }]

export function deserializeHtmlToSlate(html: string): TElement[] {
  const editor = createSlateEditor({ plugins: EditorKit })
  const fragment = deserializeHtml(editor, {
    element: html.trim() || "<p></p>",
  })

  return fragment.length > 0 ? (fragment as TElement[]) : EMPTY_VALUE
}

export async function serializeSlateToHtml(value: TElement[]): Promise<string> {
  const editor = createStaticEditor({ plugins: EditorKit })
  editor.tf.setValue(value)

  return await serializeHtml(editor, {
    stripClassNames: true,
    stripDataAttributes: true,
  })
}

export { slateToPlainText } from "./plain-text"
