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

import { ThumbnailDisplay } from "@/components/products/thumbnail-display"

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

describe("ThumbnailDisplay", () => {
  test("renders select thumbnail button when no thumbnail provided", () => {
    const onChange = vi.fn()

    act(() => {
      root?.render(
        <ThumbnailDisplay
          thumbnail={null}
          onChange={onChange}
          onClear={() => undefined}
        />,
      )
    })

    expect(container?.textContent).toContain("Select Thumbnail")

    const btn = container?.querySelector("button")

    act(() => {
      btn?.click()
    })

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test("renders thumbnail image and change/clear buttons", () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    const thumbnail = {
      id: "t1",
      url: "https://example.com/thumb.png",
      originalName: "Thumb.png",
      type: "images" as const,
    }

    act(() => {
      root?.render(
        <ThumbnailDisplay
          thumbnail={thumbnail}
          onChange={onChange}
          onClear={onClear}
        />,
      )
    })

    const img = container?.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("alt")).toBe("Thumb.png")

    const buttons = container?.querySelectorAll("button")
    expect(buttons?.length).toBe(2)

    act(() => {
      ;(buttons?.[1] as HTMLElement)?.click()
    })

    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
