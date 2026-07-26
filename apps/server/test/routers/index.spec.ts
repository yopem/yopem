import { router } from "server/routers"
import { describe, expect, test } from "vite-plus/test"

describe("router composition", () => {
  test("exports a router object", () => {
    expect(router).toBeDefined()
    expect(typeof router).toBe("object")
  })

  test("starts empty during foundation (no procedures yet)", () => {
    expect(Object.keys(router)).toHaveLength(0)
  })
})
