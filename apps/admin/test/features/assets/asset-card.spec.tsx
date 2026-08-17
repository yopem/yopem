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

import { AssetCard, type Asset } from "@/features/assets/asset-card"

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

describe("AssetCard", () => {
  const asset: Asset = {
    id: "asset_1",
    filename: "test-file.webp",
    originalName: "Original Image.png",
    type: "images",
    size: 2097152,
    url: "https://example.com/test-file.webp",
    createdAt: new Date("2026-01-01"),
  }

  test("renders asset details, badge, and image tag", () => {
    act(() => {
      root?.render(
        <AssetCard
          asset={asset}
          onPreview={() => undefined}
          onDelete={() => undefined}
        />,
      )
    })

    expect(container?.textContent).toContain("test-file.webp")
    expect(container?.textContent).toContain("Original Image.png")
    expect(container?.textContent).toContain("images")
    expect(container?.textContent).toContain("2 MB")

    const img = container?.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("alt")).toBe("Original Image.png")
  })

  test("triggers onPreview when clicking card", () => {
    const onPreview = vi.fn()

    act(() => {
      root?.render(
        <AssetCard
          asset={asset}
          onPreview={onPreview}
          onDelete={() => undefined}
        />,
      )
    })

    const card = container?.firstElementChild

    act(() => {
      ;(card as HTMLElement)?.click()
    })

    expect(onPreview).toHaveBeenCalledWith(asset)
  })
})
