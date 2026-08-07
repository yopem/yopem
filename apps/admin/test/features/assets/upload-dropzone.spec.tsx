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

import { UploadDropzone } from "@/features/assets/upload-dropzone"

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

describe("UploadDropzone", () => {
  test("renders dropzone instructions and handles file select", () => {
    const onUpload = vi.fn()

    act(() => {
      root?.render(<UploadDropzone onUpload={onUpload} maxSizeMB={10} />)
    })

    expect(container?.textContent).toContain("Click to upload or drag and drop")

    const input = container?.querySelector('input[type="file"]')
    expect(input).not.toBeNull()

    const file = new File(["test-content"], "sample.png", { type: "image/png" })
    Object.defineProperty(input, "files", { value: [file] })

    act(() => {
      input?.dispatchEvent(new Event("change", { bubbles: true }))
    })

    expect(onUpload).toHaveBeenCalledWith(file)
  })
})
