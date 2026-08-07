import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/(admin-console)/settings/index"

describe("settings index route", () => {
  test("exports a configured Route with a component", () => {
    expect(Route).toBeDefined()
    expect(typeof Route.options.component).toBe("function")
  })
})
