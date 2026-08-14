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

import { ProductSelectCard } from "@/features/dashboard/product-select-card"

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

describe("ProductSelectCard", () => {
  test("is defined", () => {
    expect(ProductSelectCard).toBeDefined()
  })

  test("renders product name, excerpt, and credits", () => {
    act(() => {
      root?.render(
        <ProductSelectCard
          product={{
            id: "prod_1",
            slug: "test-tool",
            name: "Test Tool",
            excerpt: "A useful tool for testing.",
            creditsPerRun: 5,
          }}
          selected={false}
          onSelect={vi.fn()}
        />,
      )
    })

    expect(container?.textContent).toContain("Test Tool")
    expect(container?.textContent).toContain("A useful tool for testing.")
    expect(container?.textContent).toContain("5 credits")
  })

  test("calls onSelect when clicked", () => {
    const onSelect = vi.fn()
    act(() => {
      root?.render(
        <ProductSelectCard
          product={{ id: "prod_1", slug: "test-tool", name: "Test Tool" }}
          selected={false}
          onSelect={onSelect}
        />,
      )
    })

    const card = container?.querySelector("button")
    act(() => {
      card?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      )
    })

    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})
