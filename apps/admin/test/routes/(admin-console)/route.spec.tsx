import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/(admin-console)/route"

describe("admin-console layout route", () => {
  test("registers a session guard via beforeLoad with a pending component", () => {
    expect(Route).toBeDefined()
    expect(typeof Route.options.beforeLoad).toBe("function")
    expect(typeof Route.options.component).toBe("function")
    expect(typeof Route.options.pendingComponent).toBe("function")
  })
})
