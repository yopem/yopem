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

import type { Asset } from "@/features/assets/asset-card"

import { AssetPreviewDialog } from "@/features/assets/asset-preview-dialog"

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

describe("AssetPreviewDialog", () => {
  const asset: Asset = {
    id: "asset_2",
    filename: "preview.webp",
    originalName: "Preview Header.png",
    type: "images",
    size: 1048576,
    url: "https://example.com/preview.webp",
    createdAt: new Date("2026-01-01"),
  }

  test("renders asset header metadata and image when open", () => {
    act(() => {
      root?.render(
        <AssetPreviewDialog
          asset={asset}
          onClose={() => undefined}
          onDelete={() => undefined}
        />,
      )
    })

    expect(document.body.textContent).toContain("Preview Header.png")
    expect(document.body.textContent).toContain("1 MB • images")

    const img = document.body.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("alt")).toBe("Preview Header.png")
  })

  test("triggers onDelete when clicking delete button", () => {
    const onDelete = vi.fn()
    const onClose = vi.fn()

    act(() => {
      root?.render(
        <AssetPreviewDialog
          asset={asset}
          onClose={onClose}
          onDelete={onDelete}
        />,
      )
    })

    const deleteBtn = Array.from(document.body.querySelectorAll("button")).find(
      (btn) => btn.textContent?.includes("Delete"),
    )

    expect(deleteBtn).not.toBeUndefined()

    act(() => {
      deleteBtn?.click()
    })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(asset)
  })
})
