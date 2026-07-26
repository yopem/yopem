import { describe, expect, test } from "vite-plus/test"

import GlobalBreadcrumb from "@/components/layout/global-breadcrumb"

describe("GlobalBreadcrumb", () => {
  test("is a React component (function)", () => {
    expect(typeof GlobalBreadcrumb).toBe("function")
  })
})
