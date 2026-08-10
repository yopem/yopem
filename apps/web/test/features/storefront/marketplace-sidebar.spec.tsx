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

import { MarketplaceSidebar } from "@/features/storefront/marketplace-sidebar"

const navigateMock = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
  useSearch: () => ({ categoryIds: ["cat-1"], tagIds: [] }),
}))

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
  navigateMock.mockReset()
})

const categories = [{ id: "cat-1", name: "Images", slug: "images" }]
const tags = [{ id: "tag-1", name: "gpt", slug: "gpt" }]

describe("MarketplaceSidebar", () => {
  test("renders category and tag filters with selection state", () => {
    act(() => {
      root?.render(<MarketplaceSidebar categories={categories} tags={tags} />)
    })

    expect(container?.textContent).toContain("Categories")
    expect(container?.textContent).toContain("Images")
    expect(container?.textContent).toContain("Tags")
    expect(container?.textContent).toContain("gpt")
  })

  test("clears filters when clear all is clicked", () => {
    act(() => {
      root?.render(<MarketplaceSidebar categories={categories} tags={tags} />)
    })

    const clearButton = Array.from(
      container?.querySelectorAll("button") ?? [],
    ).find((btn) => btn.textContent?.includes("Clear all filters"))

    act(() => {
      clearButton?.click()
    })

    expect(navigateMock).toHaveBeenCalledTimes(1)
  })
})
