import type { TElement, TText } from "platejs"

function isTextLeaf(node: unknown): node is TText {
  return (
    !!node &&
    typeof node === "object" &&
    typeof (node as { text?: unknown }).text === "string"
  )
}

function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return ""
  const n = node as { text?: string; children?: unknown[] }

  if (typeof n.text === "string") return n.text
  if (Array.isArray(n.children)) {
    const parts = n.children.map((child) => extractText(child))
    const inline = n.children.some((child) => isTextLeaf(child))
    return inline ? parts.join("") : parts.join("\n")
  }
  return ""
}

export function slateToPlainText(value: TElement[]): string {
  const blocks = value.map((block) => extractText(block))
  return blocks.filter((text) => text.length > 0).join("\n")
}
