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

import { MarketplaceGrid } from "@/features/storefront/marketplace-grid"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <a href="#">{children}</a>
  ),
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
})

describe("MarketplaceGrid", () => {
  test("shows the empty state when there are no products", () => {
    act(() => {
      root?.render(<MarketplaceGrid products={[]} />)
    })

    expect(container?.textContent).toContain("No products found")
  })

  test("renders a product card per product", () => {
    act(() => {
      root?.render(
        <MarketplaceGrid
          products={[
            {
              id: "prod_1",
              slug: "tool-a",
              name: "Tool A",
              excerpt: "First tool",
              creditsPerRun: 1,
            },
            {
              id: "prod_2",
              slug: "tool-b",
              name: "Tool B",
              excerpt: "Second tool",
              creditsPerRun: 2,
            },
          ]}
        />,
      )
    })

    expect(container?.textContent).toContain("Tool A")
    expect(container?.textContent).toContain("Tool B")
    expect(container?.textContent).not.toContain("No products found")
  })
})
