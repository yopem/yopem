import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("env", () => ({
  siteUrl: "",
}))

import { getSiteUrl } from "@/lib/site-url"

describe("getSiteUrl", () => {
  test("falls back to localhost when siteUrl is empty", () => {
    expect(getSiteUrl()).toBe("http://localhost:3000")
  })
})
