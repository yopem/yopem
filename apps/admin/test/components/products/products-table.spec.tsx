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

import { ProductsTable } from "@/components/products/products-table"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children?: React.ReactNode
    to?: string
    className?: string
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

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

describe("ProductsTable", () => {
  const products = [
    {
      id: "p1",
      name: "Product Alpha",
      description: "First product",
      status: "active" as const,
      creditsPerRun: 2,
      createdAt: new Date("2026-01-01"),
    },
    {
      id: "p2",
      name: "Product Beta",
      description: "Second product",
      status: "draft" as const,
      creditsPerRun: 1,
      createdAt: new Date("2026-01-02"),
    },
  ]

  test("renders product rows and status badges", () => {
    act(() => {
      root?.render(
        <ProductsTable
          products={products}
          isLoading={false}
          selectedProductIds={["p1"]}
          onToggleAll={() => undefined}
          onToggleProduct={() => undefined}
          onDelete={() => undefined}
          duplicateMutation={{ mutate: vi.fn(), isPending: false } as never}
        />,
      )
    })

    expect(container?.textContent).toContain("Product Alpha")
    expect(container?.textContent).toContain("Product Beta")
    expect(container?.textContent).toContain("active")
    expect(container?.textContent).toContain("draft")
  })
})
