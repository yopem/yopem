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

import { GlobalSidebarNav } from "@/components/layout/global-sidebar-nav"

let mockPathname = "/"

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
  useLocation: () => ({ pathname: mockPathname }),
}))

;(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
let root: Root | null = null

beforeEach(() => {
  mockPathname = "/"
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

describe("GlobalSidebarNav", () => {
  const items = [
    {
      icon: <span id="dashboard-icon">📊</span>,
      label: "Dashboard",
      href: "/",
    },
    {
      icon: <span id="products-icon">📦</span>,
      label: "Products",
      href: "/products",
      subItems: [
        { label: "All Products", href: "/products" },
        { label: "Add Product", href: "/products/add" },
      ],
    },
    {
      icon: <span id="settings-icon">⚙️</span>,
      label: "Settings",
      href: "/settings",
    },
  ]

  test("renders navigation links and handles sub-item expansion", () => {
    act(() => {
      root?.render(<GlobalSidebarNav items={items} />)
    })

    expect(container?.textContent).toContain("Dashboard")
    expect(container?.textContent).toContain("Products")
    expect(container?.textContent).toContain("Settings")

    const productExpandButton = Array.from(
      container?.querySelectorAll("button") ?? [],
    ).find((btn) => btn.textContent?.includes("Products"))

    expect(productExpandButton).not.toBeUndefined()

    act(() => {
      productExpandButton?.click()
    })

    expect(container?.textContent).toContain("All Products")
    expect(container?.textContent).toContain("Add Product")
  })

  test("auto-expands sub-items when child route is active", () => {
    mockPathname = "/products/add"

    act(() => {
      root?.render(<GlobalSidebarNav items={items} />)
    })

    expect(container?.textContent).toContain("All Products")
    expect(container?.textContent).toContain("Add Product")
  })
})
