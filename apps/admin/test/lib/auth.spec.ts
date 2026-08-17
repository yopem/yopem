import { describe, expect, test } from "vite-plus/test"

import { getSession, loginFn, logoutFn } from "@/lib/auth"

describe("lib/auth server functions", () => {
  test("exports createServerFn-backed handlers", () => {
    expect(typeof getSession).toBe("function")
    expect(typeof loginFn).toBe("function")
    expect(typeof logoutFn).toBe("function")
  })
})
