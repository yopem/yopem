import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/(auth)/route"

describe("auth layout route", () => {
  test("registers a session guard via beforeLoad", () => {
    expect(Route).toBeDefined()
    expect(typeof Route.options.beforeLoad).toBe("function")
    expect(typeof Route.options.component).toBe("function")
  })
})
