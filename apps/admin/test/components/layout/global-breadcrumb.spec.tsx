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

import { GlobalBreadcrumb } from "@/components/layout/global-breadcrumb"

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

describe("GlobalBreadcrumb", () => {
  test("renders breadcrumb items and links", () => {
    const items = [
      { label: "Dashboard", href: "/" },
      { label: "Products", href: "/products" },
      { label: "Edit Product" },
    ]

    act(() => {
      root?.render(<GlobalBreadcrumb items={items} />)
    })

    const links = container?.querySelectorAll("a")
    expect(links?.length).toBe(2)
    expect(links?.[0].getAttribute("href")).toBe("/")
    expect(links?.[0].textContent).toBe("Dashboard")
    expect(links?.[1].getAttribute("href")).toBe("/products")
    expect(links?.[1].textContent).toBe("Products")

    const currentSpan = container?.querySelector("span.font-medium")
    expect(currentSpan?.textContent).toBe("Edit Product")

    const separators = Array.from(
      container?.querySelectorAll("span") ?? [],
    ).filter((el) => el.textContent === "/")
    expect(separators.length).toBe(2)
  })
})
