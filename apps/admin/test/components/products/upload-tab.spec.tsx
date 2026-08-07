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

import { UploadTab } from "@/components/products/upload-tab"

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

describe("UploadTab", () => {
  test("renders click to upload area and handles file input", () => {
    const onUpload = vi.fn()
    const onCancel = vi.fn()

    act(() => {
      root?.render(
        <UploadTab uploading={false} onUpload={onUpload} onCancel={onCancel} />,
      )
    })

    expect(container?.textContent).toContain("Click to upload")

    const cancelBtn = container?.querySelector("button")

    act(() => {
      cancelBtn?.click()
    })

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
