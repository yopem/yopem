import { describe, expect, test } from "vite-plus/test"

import NotFound from "@/components/not-found"

describe("NotFound", () => {
  test("is a React component (function)", () => {
    expect(typeof NotFound).toBe("function")
  })
})
