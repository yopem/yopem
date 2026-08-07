// @vitest-environment jsdom

import type { ReactNode } from "react"

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

import { ProductCard } from "@/components/product-card"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to?: string | object }) => (
    <a href={typeof to === "string" ? to : "#"}>{children}</a>
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

describe("ProductCard component", () => {
  test("is defined", () => {
    expect(ProductCard).toBeDefined()
  })

  test("renders product name and excerpt", () => {
    act(() => {
      root?.render(
        <ProductCard
          product={{
            id: "prod_1",
            slug: "test-tool",
            name: "Test Tool",
            excerpt: "A useful tool for testing.",
            creditsPerRun: 5,
          }}
        />,
      )
    })

    expect(container?.textContent).toContain("Test Tool")
    expect(container?.textContent).toContain("A useful tool for testing.")
    expect(container?.textContent).toContain("5 credits")
  })
})
