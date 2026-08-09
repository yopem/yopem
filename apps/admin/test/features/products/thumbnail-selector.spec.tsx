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

import { ThumbnailSelector } from "@/features/products/thumbnail-selector"

vi.mock("rpc/query", () => ({
  queryApi: {
    assets: {
      list: {
        queryOptions: vi.fn(() => ({
          queryKey: ["assets", "list"],
          queryFn: vi.fn(),
        })),
      },
    },
  },
}))

let queryResult: { data?: { assets: unknown[] } } = { data: undefined }

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => queryResult,
}))

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
  queryResult = { data: undefined }
})

describe("ThumbnailSelector", () => {
  test("renders thumbnail collapsible card and trigger button", () => {
    act(() => {
      root?.render(
        <ThumbnailSelector value={undefined} onChange={() => undefined} />,
      )
    })

    expect(container?.textContent).toContain("Thumbnail")
    expect(container?.textContent).toContain("Select Thumbnail")
  })

  test("renders the matching asset as the current thumbnail when a value is set", () => {
    const asset = {
      id: "asset-1",
      url: "https://example.com/image.webp",
      originalName: "hero.webp",
      type: "image",
    }
    queryResult = { data: { assets: [asset] } }

    act(() => {
      root?.render(
        <ThumbnailSelector value="asset-1" onChange={() => undefined} />,
      )
    })

    expect(container?.querySelector("img")?.getAttribute("alt")).toBe(
      "hero.webp",
    )
    expect(container?.textContent).toContain("Change")
  })
})
