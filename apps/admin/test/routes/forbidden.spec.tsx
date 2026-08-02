import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/forbidden"

describe("forbidden route", () => {
  test("is defined with a component and no beforeLoad guard", () => {
    expect(Route).toBeDefined()
    expect(typeof Route.options.component).toBe("function")
    expect(Route.options.beforeLoad).toBeUndefined()
  })
})
