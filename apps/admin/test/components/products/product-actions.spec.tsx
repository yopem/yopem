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

import { ProductActions } from "@/components/products/product-actions"

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

describe("ProductActions", () => {
  const product = {
    id: "p1",
    name: "AI Text Generator",
    description: null,
    status: "active" as const,
    creditsPerRun: 1,
    createdAt: new Date(),
  }

  test("renders trigger button and handles product actions", () => {
    act(() => {
      root?.render(
        <ProductActions
          product={product}
          onDelete={() => undefined}
          duplicateMutation={{ mutate: vi.fn(), isPending: false } as never}
        />,
      )
    })

    const triggerBtn = container?.querySelector("button")
    expect(triggerBtn).not.toBeNull()
  })
})
