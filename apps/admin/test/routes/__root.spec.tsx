import { describe, expect, test } from "vite-plus/test"

import type { SessionUser } from "auth/types"

import { Route, type RouterContext } from "@/routes/__root"

const _sessionTypeCheck: RouterContext["session"] extends SessionUser | null
  ? true
  : false = true

describe("root route", () => {
  test("exports a configured Route with head/error/notFound components", () => {
    expect(_sessionTypeCheck).toBe(true)
    expect(Route).toBeDefined()
    const options = Route.options
    expect(typeof options.head).toBe("function")
    expect(options.errorComponent).toBeDefined()
    expect(options.notFoundComponent).toBeDefined()
  })
})
