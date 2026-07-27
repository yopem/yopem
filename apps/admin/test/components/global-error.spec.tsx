import { describe, expect, test } from "vite-plus/test"

import { GlobalError } from "@/components/global-error"

describe("GlobalError", () => {
  test("is a React component (function)", () => {
    expect(typeof GlobalError).toBe("function")
  })
})
