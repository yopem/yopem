import { describe, expect, test } from "vite-plus/test"

import { Route, type RouterContext } from "@/routes/__root"

const _contextHasSession: "session" extends keyof RouterContext ? true : false =
  true

describe("root route", () => {
  test("configures head/error/notFound components (session from initial context)", () => {
    expect(_contextHasSession).toBe(true)
    expect(Route).toBeDefined()
    const options = Route.options
    expect(typeof options.head).toBe("function")
    expect(options.errorComponent).toBeDefined()
    expect(options.notFoundComponent).toBeDefined()
  })
})
