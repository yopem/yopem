// @vitest-environment jsdom

import { describe, expect, test, vi } from "vite-plus/test"

import { loginFn } from "@/lib/auth"
import { loginAndRedirect } from "@/lib/login"

vi.mock("@/lib/auth", () => ({
  loginFn: vi.fn(),
}))

describe("loginAndRedirect", () => {
  test("redirects to the authorize url returned by loginFn", async () => {
    vi.mocked(loginFn).mockResolvedValue({
      redirectTo: "https://issuer.example/authorize",
    })

    await loginAndRedirect("/dashboard")

    expect(loginFn).toHaveBeenCalledWith({ data: { returnTo: "/dashboard" } })
  })
})
