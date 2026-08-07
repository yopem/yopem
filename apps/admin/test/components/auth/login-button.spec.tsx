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

import { toastManager } from "ui/toast"

import { LoginButton } from "@/components/auth/login-button"
import { loginFn } from "@/lib/auth"

vi.mock("@/lib/auth", () => ({
  loginFn: vi.fn(),
}))

vi.mock("ui/toast", () => ({
  toastManager: { add: vi.fn() },
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
})

describe("LoginButton", () => {
  test("renders login button with initial state", () => {
    act(() => {
      root?.render(<LoginButton />)
    })

    const button = container?.querySelector("button")
    expect(button).not.toBeNull()
    expect(button?.textContent).toContain("Login with Google")
    expect(button?.hasAttribute("disabled")).toBe(false)
  })

  test("handles successful login click", () => {
    vi.mocked(loginFn).mockResolvedValue({
      redirectTo: "https://auth.example.com",
    })

    act(() => {
      root?.render(<LoginButton />)
    })

    const button = container?.querySelector("button")

    act(() => {
      button?.click()
    })

    expect(loginFn).toHaveBeenCalledTimes(1)
  })

  test("shows toast on login error", () => {
    vi.mocked(loginFn).mockRejectedValue(new Error("Network connection failed"))

    act(() => {
      root?.render(<LoginButton />)
    })

    const button = container?.querySelector("button")

    act(() => {
      button?.click()
    })

    expect(toastManager.add).toHaveBeenCalledWith({
      title: "Login failed",
      description: "Network connection failed",
      type: "error",
    })
  })
})
