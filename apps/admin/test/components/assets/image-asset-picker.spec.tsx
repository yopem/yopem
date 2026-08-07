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

import { queryApi } from "rpc/query"
import { toastManager } from "ui/toast"

import { ImageAssetPicker } from "@/components/assets/image-asset-picker"

vi.mock("rpc/query", () => ({
  queryApi: {
    assets: {
      list: { call: vi.fn() },
      upload: { call: vi.fn() },
    },
  },
}))

vi.mock("ui/toast", () => ({
  toastManager: { add: vi.fn() },
}))

;(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const assets = [
  {
    id: "asset_1",
    filename: "one.webp",
    url: "https://example.com/one.webp",
    originalName: "one.webp",
    type: "images" as const,
    size: 100,
    createdAt: null,
    updatedAt: null,
  },
  {
    id: "asset_2",
    filename: "two.webp",
    url: "https://example.com/two.webp",
    originalName: "two.webp",
    type: "images" as const,
    size: 200,
    createdAt: null,
    updatedAt: null,
  },
]

function setup(ui: React.ReactElement) {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(ui))
  return {
    root,
    container,
    cleanup: () => {
      act(() => root.unmount())
      document.body.removeChild(container)
    },
  }
}

let current: {
  root: Root
  container: HTMLDivElement
  cleanup: () => void
} | null = null

afterEach(() => {
  current?.cleanup()
  current = null
  vi.clearAllMocks()
})

describe("apps/admin/components/assets/image-asset-picker", () => {
  beforeEach(() => {
    vi.mocked(queryApi.assets.list.call).mockResolvedValue({ assets })
  })

  test("is a React component", () => {
    expect(typeof ImageAssetPicker).toBe("function")
  })

  test("loads and displays library assets", async () => {
    const onSelect = vi.fn()
    const onOpenChange = vi.fn()

    current = setup(
      <ImageAssetPicker
        open={true}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
      />,
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(queryApi.assets.list.call).toHaveBeenCalledWith({
      type: "images",
      limit: 100,
    })
    const images = document.body.querySelectorAll("img")
    expect(images.length).toBe(2)
    expect(Array.from(images).map((img) => img.getAttribute("alt"))).toContain(
      "one.webp",
    )
    expect(Array.from(images).map((img) => img.getAttribute("alt"))).toContain(
      "two.webp",
    )
  })

  test("selects an asset and calls onSelect", async () => {
    const onSelect = vi.fn()
    const onOpenChange = vi.fn()

    current = setup(
      <ImageAssetPicker
        open={true}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
      />,
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const assetButton = document.body.querySelector(
      `button[aria-label="Select ${assets[0].originalName}"]`,
    )
    expect(assetButton).not.toBeNull()

    await act(async () => {
      ;(assetButton as HTMLElement).click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const selectButton = Array.from(
      document.body.querySelectorAll("button"),
    ).find((button) => button.textContent === "Select")
    expect(selectButton).toBeDefined()

    await act(async () => {
      selectButton?.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(onSelect).toHaveBeenCalledWith(assets[0])
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test("uploads a file and calls onSelect", async () => {
    const uploadedAsset = {
      id: "asset_3",
      filename: "three.webp",
      url: "https://example.com/three.webp",
      originalName: "three.webp",
      type: "images" as const,
      size: 300,
      createdAt: null,
      updatedAt: null,
    }
    vi.mocked(queryApi.assets.upload.call).mockResolvedValue(uploadedAsset)

    const onSelect = vi.fn()
    const onOpenChange = vi.fn()

    current = setup(
      <ImageAssetPicker
        open={true}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
      />,
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const uploadTab = Array.from(document.body.querySelectorAll("button")).find(
      (button) => button.textContent === "Upload New",
    )
    expect(uploadTab).toBeDefined()

    await act(async () => {
      uploadTab?.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const input = document.body.querySelector('input[type="file"]')
    expect(input).not.toBeNull()

    const file = new File(["image"], "three.webp", { type: "image/webp" })
    Object.defineProperty(input, "files", { value: [file] })

    await act(async () => {
      input?.dispatchEvent(new Event("change", { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(queryApi.assets.upload.call).toHaveBeenCalledWith(file)
    expect(onSelect).toHaveBeenCalledWith(uploadedAsset)
  })

  test("shows a toast when upload fails", async () => {
    vi.mocked(queryApi.assets.upload.call).mockRejectedValue(
      new Error("Upload rejected"),
    )

    const onSelect = vi.fn()
    const onOpenChange = vi.fn()

    current = setup(
      <ImageAssetPicker
        open={true}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
      />,
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const uploadTab = Array.from(document.body.querySelectorAll("button")).find(
      (button) => button.textContent === "Upload New",
    )

    await act(async () => {
      uploadTab?.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const input = document.body.querySelector('input[type="file"]')
    const file = new File(["image"], "bad.webp", { type: "image/webp" })
    Object.defineProperty(input, "files", { value: [file] })

    await act(async () => {
      input?.dispatchEvent(new Event("change", { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(onSelect).not.toHaveBeenCalled()
    expect(toastManager.add).toHaveBeenCalledWith({
      title: "Upload failed",
      description: "Upload rejected",
      type: "error",
    })
  })

  test("cancel closes the picker without selecting", async () => {
    const onSelect = vi.fn()
    const onOpenChange = vi.fn()

    current = setup(
      <ImageAssetPicker
        open={true}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
      />,
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const cancelButton = Array.from(
      document.body.querySelectorAll("button"),
    ).find((button) => button.textContent === "Cancel")
    expect(cancelButton).toBeDefined()

    await act(async () => {
      cancelButton?.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(onSelect).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
