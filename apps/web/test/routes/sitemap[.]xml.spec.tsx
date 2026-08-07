import { describe, expect, test } from "vite-plus/test"

import { Route } from "@/routes/sitemap[.]xml"

describe("Sitemap Route", () => {
  test("is defined", () => {
    expect(Route).toBeDefined()
  })
})
