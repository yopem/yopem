// @vitest-environment jsdom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test"

import { CategoryParentSelect } from "@/features/categories-tags/category-parent-select"

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

describe("CategoryParentSelect", () => {
  const categories = [
    { id: "root", name: "Hardware", parentId: null, sortOrder: 1 },
    { id: "child", name: "Laptops", parentId: "root", sortOrder: 1 },
  ]
  const tree = [
    { node: categories[0], depth: 0 },
    { node: categories[1], depth: 1 },
  ]

  test("renders label, placeholder, and tree options", () => {
    act(() => {
      root?.render(
        <CategoryParentSelect
          value={undefined}
          onChange={() => undefined}
          categories={categories}
          tree={tree}
        />,
      )
    })

    expect(container?.textContent).toContain("Parent Category")
    expect(container?.textContent).toContain("No parent")
  })

  test("shows the selected category name from the full list", () => {
    act(() => {
      root?.render(
        <CategoryParentSelect
          value="child"
          onChange={() => undefined}
          categories={categories}
          tree={tree}
        />,
      )
    })

    expect(container?.textContent).toContain("Laptops")
  })
})
