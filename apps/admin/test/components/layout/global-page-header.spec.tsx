// @vitest-environment jsdom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test"

import { GlobalPageHeader } from "@/components/layout/global-page-header"

;(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

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

describe("GlobalPageHeader", () => {
  test("renders title and description", () => {
    act(() => {
      root?.render(
        <GlobalPageHeader
          title="Products Overview"
          description="Manage catalog products and pricing"
        />,
      )
    })

    const titleEl = container?.querySelector("h2")
    expect(titleEl?.textContent).toBe("Products Overview")

    const descEl = container?.querySelector("p")
    expect(descEl?.textContent).toBe("Manage catalog products and pricing")
  })

  test("renders action element when provided", () => {
    act(() => {
      root?.render(
        <GlobalPageHeader
          title="Products"
          description="Manage products"
          action={<button id="add-btn">Add Product</button>}
        />,
      )
    })

    const actionBtn = container?.querySelector("#add-btn")
    expect(actionBtn).not.toBeNull()
    expect(actionBtn?.textContent).toBe("Add Product")
  })
})
