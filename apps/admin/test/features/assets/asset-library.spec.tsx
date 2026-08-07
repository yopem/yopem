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

import { AssetLibrary } from "@/features/assets/asset-library"

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

describe("AssetLibrary", () => {
  const assets = [
    {
      id: "a1",
      url: "https://example.com/a1.png",
      originalName: "First Image.png",
      type: "images",
    },
    {
      id: "a2",
      url: "https://example.com/a2.png",
      originalName: "Second Image.png",
      type: "images",
    },
  ]

  test("renders asset grid and calls onSelect when asset clicked", () => {
    const onSelect = vi.fn()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    act(() => {
      root?.render(
        <AssetLibrary
          assets={assets}
          selectedAssetId="a1"
          loading={false}
          onSelect={onSelect}
          onSwitchToUpload={() => undefined}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />,
      )
    })

    const assetButtons = container?.querySelectorAll(
      'button[aria-label^="Select"]',
    )
    expect(assetButtons?.length).toBe(2)

    act(() => {
      ;(assetButtons?.[1] as HTMLElement)?.click()
    })

    expect(onSelect).toHaveBeenCalledWith("a2")
  })

  test("renders empty state when no assets exist", () => {
    const onSwitchToUpload = vi.fn()

    act(() => {
      root?.render(
        <AssetLibrary
          assets={[]}
          selectedAssetId={null}
          loading={false}
          onSelect={() => undefined}
          onSwitchToUpload={onSwitchToUpload}
          onConfirm={() => undefined}
          onCancel={() => undefined}
        />,
      )
    })

    expect(container?.textContent).toContain("No images available")
    expect(container?.textContent).toContain("Upload New Image")
  })
})
