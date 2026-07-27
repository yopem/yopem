import { describe, expect, test } from "vite-plus/test"

import { getRouter } from "@/router"

describe("router", () => {
  test("getRouter is an async factory (session resolved before router creation)", () => {
    expect(typeof getRouter).toBe("function")
    expect(getRouter.constructor.name).toBe("AsyncFunction")
  })
})
