import { describe, expect, test } from "vite-plus/test"

import { getRouter } from "@/router"

describe("router", () => {
  test("getRouter is a synchronous factory (session resolved in root beforeLoad)", () => {
    expect(typeof getRouter).toBe("function")
    expect(getRouter.constructor.name).toBe("Function")
  })
})
