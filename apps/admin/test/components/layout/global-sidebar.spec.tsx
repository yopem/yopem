import { describe, expect, test } from "vite-plus/test"

import GlobalSidebar from "@/components/layout/global-sidebar"

describe("GlobalSidebar", () => {
  test("is a React component (function)", () => {
    expect(typeof GlobalSidebar).toBe("function")
  })
})
