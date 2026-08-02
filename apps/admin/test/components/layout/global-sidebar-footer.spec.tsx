import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, test } from "vite-plus/test"

import { GlobalSidebarFooter } from "@/components/layout/global-sidebar-footer"

;(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const user = {
  name: "Yandi",
  email: "xkaryanayandi@gmail.com",
  avatar: "https://example.com/avatar.webp",
}

const userWithoutAvatar = {
  name: "Yandi",
  email: "xkaryanayandi@gmail.com",
}

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
})

describe("GlobalSidebarFooter", () => {
  test("is a React component (function)", () => {
    expect(typeof GlobalSidebarFooter).toBe("function")
  })

  test("renders user name and email", () => {
    current = setup(<GlobalSidebarFooter user={user} />)

    expect(current.container.textContent).toContain(user.name)
    expect(current.container.textContent).toContain(user.email)
  })

  test("renders avatar fallback with initials", () => {
    current = setup(<GlobalSidebarFooter user={userWithoutAvatar} />)

    expect(current.container.textContent).toContain("YA")
  })

  test("opens the user menu and renders actions", async () => {
    current = setup(<GlobalSidebarFooter user={user} />)

    const trigger = current.container.querySelector("button")
    expect(trigger).not.toBeNull()

    await act(async () => {
      trigger?.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const menu = document.querySelector('[role="menu"]')
    expect(menu).not.toBeNull()
    expect(menu?.textContent).toContain("Back to Home")
    expect(menu?.textContent).toContain("Profile")
    expect(menu?.textContent).toContain("Logout")
  })
})
