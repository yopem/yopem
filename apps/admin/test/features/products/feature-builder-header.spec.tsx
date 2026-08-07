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

import { FeatureBuilderHeader } from "@/features/products/feature-builder-header"

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

describe("FeatureBuilderHeader", () => {
  test("renders breadcrumbs, status badge, and action buttons", () => {
    const onPublish = vi.fn()
    const breadcrumbItems = [
      { label: "Products", href: "/products" },
      { label: "New Product" },
    ]

    act(() => {
      root?.render(
        <FeatureBuilderHeader
          breadcrumbItems={breadcrumbItems}
          status="draft"
          onPublish={onPublish}
        />,
      )
    })

    expect(container?.textContent).toContain("Products")
    expect(container?.textContent).toContain("New Product")
    expect(container?.textContent).toContain("draft")

    const publishBtn = Array.from(
      container?.querySelectorAll("button") ?? [],
    ).find((btn) => btn.textContent?.includes("Publish"))

    expect(publishBtn).not.toBeUndefined()

    act(() => {
      publishBtn?.click()
    })

    expect(onPublish).toHaveBeenCalledTimes(1)
  })
})
