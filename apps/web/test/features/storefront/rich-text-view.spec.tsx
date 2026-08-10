// @vitest-environment jsdom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test"

import { RichTextView } from "@/features/storefront/rich-text-view"

let container: HTMLDivElement | null = null
let root: Root | null = null

beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  const currentRoot = root
  const currentContainer = container
  if (currentRoot && currentContainer) {
    act(() => currentRoot.unmount())
    document.body.removeChild(currentContainer)
  }
  container = null
  root = null
})

const renderView = (props: {
  content: unknown
  fallbackDescription?: string | null
}) => {
  act(() => {
    root?.render(<RichTextView {...props} />)
  })
}

describe("RichTextView", () => {
  test("renders nothing when content and fallback are empty", () => {
    renderView({ content: null, fallbackDescription: null })

    expect(container?.textContent).toBe("")
  })

  test("renders fallback as plain text when it has no tags", () => {
    renderView({ content: null, fallbackDescription: "Just a description" })

    expect(container?.textContent).toContain("Just a description")
    expect(container?.querySelector("p")).not.toBeNull()
  })

  test("renders fallback as HTML when it contains tags", () => {
    renderView({
      content: null,
      fallbackDescription: "<h2>Heading</h2><p>Body text</p>",
    })

    const heading = container?.querySelector("h2")
    expect(heading?.textContent).toBe("Heading")
    expect(container?.querySelector("p")?.textContent).toBe("Body text")
  })

  test("parses stringified JSON node arrays", () => {
    const content = JSON.stringify([
      { type: "h1", children: [{ text: "Title" }] },
      { type: "p", children: [{ text: "Paragraph" }] },
    ])

    renderView({ content })

    expect(container?.querySelector("h1")?.textContent).toBe("Title")
    expect(container?.querySelector("p")?.textContent).toBe("Paragraph")
  })

  test("renders a non-array string as plain text", () => {
    renderView({ content: "plain string content" })

    expect(container?.textContent).toContain("plain string content")
  })

  test("renders a non-array object as its string form", () => {
    renderView({ content: { foo: "bar" } })

    expect(container?.textContent).toContain("[object Object]")
  })

  test("applies inline formatting to text nodes", () => {
    const content = JSON.stringify([
      {
        type: "p",
        children: [
          { text: "Bold", bold: true },
          { text: " and italic", italic: true },
        ],
      },
    ])

    renderView({ content })

    expect(container?.querySelector("strong")?.textContent).toBe("Bold")
    expect(container?.querySelector("em")?.textContent).toBe(" and italic")
  })
})
