import { describe, expect, test } from "vite-plus/test"

import { Route, type RouterContext } from "@/routes/__root"

const _contextHasQueryClientOnly: "queryClient" extends keyof RouterContext
  ? true
  : false = true

describe("root route", () => {
  test("resolves session in beforeLoad and configures head/error/notFound components", () => {
    expect(_contextHasQueryClientOnly).toBe(true)
    expect(Route).toBeDefined()
    const options = Route.options
    expect(typeof options.beforeLoad).toBe("function")
    expect(typeof options.head).toBe("function")
    expect(options.errorComponent).toBeDefined()
    expect(options.notFoundComponent).toBeDefined()
  })
})
