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

import { ProductBuilderTips } from "@/components/products/product-builder-tips"

;(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
let root: Root | null = null

beforeEach(() => {
  localStorage.clear()
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

describe("ProductBuilderTips", () => {
  test("renders step tip title and description", () => {
    act(() => {
      root?.render(<ProductBuilderTips mode="create" step="basics" />)
    })

    expect(container?.textContent).toContain("Start with the basics")
    expect(container?.textContent).toContain(
      "Give your product a clear name and description",
    )
  })

  test("dismisses tips when dismiss button is clicked", () => {
    act(() => {
      root?.render(<ProductBuilderTips mode="create" step="basics" />)
    })

    const dismissBtn = container?.querySelector(
      'button[aria-label="Dismiss tips"]',
    )
    expect(dismissBtn).not.toBeNull()

    act(() => {
      ;(dismissBtn as HTMLElement)?.click()
    })

    expect(localStorage.getItem("yopem:product-builder-tips-dismissed")).toBe(
      "1",
    )
  })
})
