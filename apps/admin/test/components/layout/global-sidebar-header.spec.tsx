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

import { GlobalSidebarHeader } from "@/components/layout/global-sidebar-header"

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

describe("GlobalSidebarHeader", () => {
  test("renders title and subtitle with logo home link", () => {
    act(() => {
      root?.render(
        <GlobalSidebarHeader title="Yopem Admin" subtitle="Control Panel" />,
      )
    })

    const titleEl = container?.querySelector("h1")
    expect(titleEl?.textContent).toBe("Yopem Admin")

    const subtitleEl = container?.querySelector("p")
    expect(subtitleEl?.textContent).toBe("Control Panel")

    const links = container?.querySelectorAll("a")
    expect(links?.length).toBeGreaterThanOrEqual(1)
    expect(links?.[0].getAttribute("href")).toBe("/")
  })
})
