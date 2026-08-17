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

import { TagSelector } from "@/features/products/tag-selector"

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

describe("TagSelector", () => {
  const tags = [
    { id: "t1", name: "Popular", slug: "popular" },
    { id: "t2", name: "New", slug: "new" },
  ]

  test("renders tag list and handles tag selection toggle", () => {
    const onChange = vi.fn()

    act(() => {
      root?.render(
        <TagSelector tags={tags} selectedIds={["t1"]} onChange={onChange} />,
      )
    })

    expect(container?.textContent).toContain("Tags")
    expect(container?.textContent).toContain("Popular")
    expect(container?.textContent).toContain("New")

    const newTagLabel = Array.from(
      container?.querySelectorAll("label") ?? [],
    ).find((lbl) => lbl.textContent?.includes("New"))

    expect(newTagLabel).not.toBeUndefined()

    act(() => {
      newTagLabel?.click()
    })

    expect(onChange).toHaveBeenCalledWith(["t1", "t2"])
  })
})
