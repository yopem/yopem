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

import { SidebarProvider } from "ui/sidebar"

import { GlobalSidebar } from "@/components/layout/global-sidebar"

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
  useLocation: () => ({ pathname: "/" }),
}))

vi.mock("@/lib/auth", () => ({
  logoutFn: vi.fn(),
}))

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

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

describe("GlobalSidebar", () => {
  test("renders full sidebar with header, nav, theme switcher, and user footer", () => {
    const navItems = [
      { icon: <span>🏠</span>, label: "Overview", href: "/" },
      { icon: <span>⚙️</span>, label: "Settings", href: "/settings" },
    ]
    const user = { name: "Admin User", email: "admin@example.com" }

    act(() => {
      root?.render(
        <SidebarProvider>
          <GlobalSidebar
            title="Admin Hub"
            subtitle="Enterprise"
            navItems={navItems}
            user={user}
          />
        </SidebarProvider>,
      )
    })

    expect(container?.textContent).toContain("Admin Hub")
    expect(container?.textContent).toContain("Enterprise")
    expect(container?.textContent).toContain("Overview")
    expect(container?.textContent).toContain("Settings")
    expect(container?.textContent).toContain("Admin User")
    expect(container?.textContent).toContain("admin@example.com")
  })
})
