// @vitest-environment jsdom

import type { TElement } from "platejs"

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

import { DescriptionEditor } from "@/features/products/description-editor"

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {
      /* noop */
    }
    unobserve() {
      /* noop */
    }
    disconnect() {
      /* noop */
    }
  }
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

describe("DescriptionEditor", () => {
  test("renders rich text description editor container", () => {
    const initialValue: TElement[] = [
      { type: "p", children: [{ text: "Hello editor" }] },
    ]

    act(() => {
      root?.render(
        <DescriptionEditor
          initialValue={initialValue}
          onChange={() => undefined}
        />,
      )
    })

    expect(container?.querySelector(".border-input")).not.toBeNull()
  })
})
