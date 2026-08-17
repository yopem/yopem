// @vitest-environment jsdom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test"

import { SessionAvatar } from "@/components/session-avatar"

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

describe("SessionAvatar", () => {
  test("renders initials when no image is provided", () => {
    act(() => {
      root?.render(<SessionAvatar name="Jane Smith" email="jane@example.com" />)
    })

    expect(container?.textContent).toContain("JS")
  })

  test("renders initials from email when name is missing", () => {
    act(() => {
      root?.render(<SessionAvatar name={null} email="jane@example.com" />)
    })

    expect(container?.textContent).toContain("J")
  })
})
