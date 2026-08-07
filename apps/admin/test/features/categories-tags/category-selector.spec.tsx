// @vitest-environment jsdom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vite-plus/test"

import { CategorySelector } from "@/features/categories-tags/category-selector"

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
  vi.clearAllMocks()
})

describe("CategorySelector", () => {
  const categories = [
    {
      id: "cat_1",
      name: "Laptops",
      slug: "laptops",
      description: null,
      parentId: null,
      sortOrder: 1,
    },
    {
      id: "cat_2",
      name: "Monitors",
      slug: "monitors",
      description: null,
      parentId: null,
      sortOrder: 2,
    },
  ]

  test("renders categories collapsible card and handles category toggle", () => {
    const onChange = vi.fn()

    act(() => {
      root?.render(
        <CategorySelector
          categories={categories}
          selectedIds={["cat_1"]}
          onChange={onChange}
        />,
      )
    })

    expect(container?.textContent).toContain("Categories")
    expect(container?.textContent).toContain("Laptops")
    expect(container?.textContent).toContain("Monitors")

    const monitorCheckbox = Array.from(
      container?.querySelectorAll("label") ?? [],
    ).find((lbl) => lbl.textContent?.includes("Monitors"))

    expect(monitorCheckbox).not.toBeUndefined()

    act(() => {
      monitorCheckbox?.click()
    })

    expect(onChange).toHaveBeenCalledWith(["cat_1", "cat_2"])
  })
})
