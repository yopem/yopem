import type { TElement } from "platejs"

import { createStaticEditor, serializeHtml } from "@platejs/core/static"
import { createSlateEditor, deserializeHtml, KEYS } from "platejs"

import { SerializeKit } from "./serialize-kit"

const EMPTY_VALUE: TElement[] = [{ type: KEYS.p, children: [{ text: "" }] }]

function normalizeSlateNode(node: unknown): TElement {
  const element = node as TElement | undefined
  if (!element || typeof element !== "object") {
    return EMPTY_VALUE[0]
  }

  const children = Array.isArray(element.children)
    ? element.children.map((child) =>
        typeof child === "object" && child !== null
          ? { text: "", ...child }
          : { text: String(child ?? "") },
      )
    : [{ text: "" }]

  return {
    ...element,
    type:
      typeof element.type === "string" && element.type.length > 0
        ? element.type
        : KEYS.p,
    children: children.length > 0 ? children : EMPTY_VALUE[0].children,
  }
}

export function deserializeHtmlToSlate(html: string): TElement[] {
  const editor = createSlateEditor({ plugins: SerializeKit })
  const fragment = deserializeHtml(editor, {
    element: html.trim() || "<p></p>",
  })

  const nodes = (fragment.length > 0 ? fragment : EMPTY_VALUE) as TElement[]
  const normalized = nodes.map(normalizeSlateNode)
  return normalized.length > 0 ? normalized : EMPTY_VALUE
}

export async function serializeSlateToHtml(value: TElement[]): Promise<string> {
  const editor = createStaticEditor({ plugins: SerializeKit })
  editor.tf.setValue(value)

  return await serializeHtml(editor, {
    stripClassNames: true,
    stripDataAttributes: true,
  })
}

export { slateToPlainText } from "./plain-text"
