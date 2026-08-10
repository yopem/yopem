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

import { Pagination } from "@/features/storefront/pagination"

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

describe("Pagination", () => {
  test("renders nothing when there is a single page", () => {
    act(() => {
      root?.render(
        <Pagination
          page={1}
          totalPages={1}
          totalItems={10}
          onPageChange={vi.fn()}
        />,
      )
    })

    expect(container?.textContent).toBe("")
  })

  test("shows page summary and calls onPageChange on next", () => {
    const onPageChange = vi.fn()

    act(() => {
      root?.render(
        <Pagination
          page={1}
          totalPages={3}
          totalItems={30}
          onPageChange={onPageChange}
        />,
      )
    })

    expect(container?.textContent).toContain("Page 1 of 3 (30 tools)")

    const nextButton = Array.from(
      container?.querySelectorAll("button") ?? [],
    ).find((btn) => btn.textContent?.includes("Next"))
    act(() => {
      nextButton?.click()
    })

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  test("disables next on the last page", () => {
    const onPageChange = vi.fn()

    act(() => {
      root?.render(
        <Pagination
          page={3}
          totalPages={3}
          totalItems={30}
          onPageChange={onPageChange}
        />,
      )
    })

    const buttons = Array.from(container?.querySelectorAll("button") ?? [])
    const previous = buttons.find((btn) =>
      btn.textContent?.includes("Previous"),
    )
    const next = buttons.find((btn) => btn.textContent?.includes("Next"))

    expect(previous?.disabled).toBe(false)
    expect(next?.disabled).toBe(true)
  })

  test("disables previous on the first page", () => {
    const onPageChange = vi.fn()

    act(() => {
      root?.render(
        <Pagination
          page={1}
          totalPages={3}
          totalItems={30}
          onPageChange={onPageChange}
        />,
      )
    })

    const buttons = Array.from(container?.querySelectorAll("button") ?? [])
    const previous = buttons.find((btn) =>
      btn.textContent?.includes("Previous"),
    )
    const next = buttons.find((btn) => btn.textContent?.includes("Next"))

    expect(previous?.disabled).toBe(true)
    expect(next?.disabled).toBe(false)
  })
})
