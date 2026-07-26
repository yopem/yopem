import { describe, expect, test } from "vite-plus/test"

import Providers from "@/components/providers"

describe("Providers", () => {
  test("is a React component (function)", () => {
    expect(typeof Providers).toBe("function")
  })
})
