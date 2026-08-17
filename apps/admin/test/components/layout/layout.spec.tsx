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

import { Layout } from "@/components/layout/layout"

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
  useNavigate: () => vi.fn(),
}))

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: [], isLoading: false }),
}))

vi.mock("rpc/query", () => ({
  queryApi: {
    categories: { list: { queryOptions: vi.fn() } },
    tags: { list: { queryOptions: vi.fn() } },
    products: { list: { queryOptions: vi.fn() } },
  },
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

describe("Layout", () => {
  test("renders main layout shell with sidebar, search header, and children content", () => {
    const navItems = [{ icon: <span>🏠</span>, label: "Home", href: "/" }]
    const user = { name: "Test User", email: "test@example.com" }

    act(() => {
      root?.render(
        <Layout
          title="Dashboard"
          subtitle="Console"
          navItems={navItems}
          user={user}
        >
          <div id="page-content">Welcome to Dashboard</div>
        </Layout>,
      )
    })

    expect(container?.textContent).toContain("Dashboard")
    expect(container?.textContent).toContain("Console")
    expect(container?.textContent).toContain("Test User")
    expect(container?.querySelector("#page-content")?.textContent).toBe(
      "Welcome to Dashboard",
    )
  })
})
