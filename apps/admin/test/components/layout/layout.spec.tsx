import { describe, expect, test } from "vite-plus/test"

import Layout from "@/components/layout/layout"

describe("Layout", () => {
  test("is a React component (function)", () => {
    expect(typeof Layout).toBe("function")
  })
})
