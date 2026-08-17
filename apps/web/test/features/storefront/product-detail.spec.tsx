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

import { ProductDetail } from "@/features/storefront/product-detail"
import { loginAndRedirect } from "@/lib/login"

const { product, sessionState, navigateMock } = vi.hoisted(() => {
  const product = {
    id: "prod_1",
    slug: "test-product",
    name: "Test Product",
    description: "A test product",
    descriptionContent: null,
    excerpt: "Test excerpt",
    status: "active",
    creditsPerRun: 5,
    outputFormat: "plain",
    workflow: null,
    categories: [],
    tags: [],
    thumbnail: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const sessionState = { value: null as null | { id: string } }
  const navigateMock = vi.fn()
  return { product, sessionState, navigateMock }
})

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: product }),
}))

vi.mock("@tanstack/react-router", () => ({
  useLoaderData: () => ({ product }),
  useRouteContext: () => ({ session: sessionState.value }),
  useNavigate: () => navigateMock,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

vi.mock("@/components/site-layout", () => ({
  SiteLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

vi.mock("@/features/storefront/rich-text-view", () => ({
  RichTextView: ({ content }: { content: unknown }) => (
    <div>{String(content)}</div>
  ),
}))

vi.mock("@/lib/login", () => ({
  loginAndRedirect: vi.fn(),
}))

vi.mock("ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}))

vi.mock("ui/button", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => <button onClick={onClick}>{children}</button>,
}))

vi.mock("ui/separator", () => ({
  Separator: () => <hr />,
}))

let container: HTMLDivElement | null = null
let root: Root | null = null

beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  sessionState.value = null
  navigateMock.mockClear()
  vi.mocked(loginAndRedirect).mockClear()
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

const renderPage = () => {
  act(() => {
    root?.render(<ProductDetail />)
  })
}

describe("Product Detail Route", () => {
  test("renders a Use App call-to-action", () => {
    renderPage()

    expect(container?.textContent).toContain("Use App")
  })

  test("does not render the execution form", () => {
    renderPage()

    expect(container?.textContent).not.toContain("Run Tool")
    expect(container?.textContent).not.toContain("Sign in to Run Tool")
  })

  test("guest clicking Use App redirects through login to the workspace", () => {
    renderPage()

    const button = Array.from(container?.querySelectorAll("button") ?? []).find(
      (b) => b.textContent?.includes("Use App"),
    )
    act(() => {
      button?.click()
    })

    expect(loginAndRedirect).toHaveBeenCalledWith(
      "/dashboard/products?product=test-product",
    )
  })

  test("authenticated user clicking Use App navigates to the workspace", () => {
    sessionState.value = { id: "user_1" }
    renderPage()

    const button = Array.from(container?.querySelectorAll("button") ?? []).find(
      (b) => b.textContent?.includes("Use App"),
    )
    act(() => {
      button?.click()
    })

    expect(navigateMock).toHaveBeenCalledWith({
      to: "/dashboard/products",
      search: { product: "test-product" },
    })
  })
})
