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

import { ProductPreviewSheet } from "@/features/products/product-preview-sheet"

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

describe("ProductPreviewSheet", () => {
  test("renders preview title and execute preview button when open", () => {
    act(() => {
      root?.render(
        <ProductPreviewSheet
          open={true}
          onOpenChange={() => undefined}
          inputVariables={[]}
          onExecute={() => undefined}
          isExecuting={false}
          result={null}
        />,
      )
    })

    expect(document.body.textContent).toContain("Product Preview")
    expect(document.body.textContent).toContain("Execute Preview")
  })
})
