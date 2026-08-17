// @vitest-environment jsdom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test"

import { UploadProgress } from "@/features/assets/upload-progress"

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
})

describe("UploadProgress", () => {
  test("renders progress status when uploading", () => {
    act(() => {
      root?.render(<UploadProgress isUploading={true} />)
    })

    expect(container?.textContent).toContain("Uploading...")
  })

  test("renders nothing when not uploading", () => {
    act(() => {
      root?.render(<UploadProgress isUploading={false} />)
    })

    expect(container?.innerHTML).toBe("")
  })
})
