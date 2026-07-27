import { describe, expect, test } from "vite-plus/test"

import { LoginButton } from "@/components/auth/login-button"

describe("LoginButton", () => {
  test("is a React component (function)", () => {
    expect(typeof LoginButton).toBe("function")
  })
})
