import { describe, expect, test } from "vite-plus/test"

import GlobalPageHeader from "@/components/layout/global-page-header"

describe("GlobalPageHeader", () => {
  test("is a React component (function)", () => {
    expect(typeof GlobalPageHeader).toBe("function")
  })
})
