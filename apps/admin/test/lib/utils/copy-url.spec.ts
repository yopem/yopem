import { describe, expect, test } from "vite-plus/test"

import { handleCopyUrl } from "@/lib/utils/copy-url"

describe("handleCopyUrl", () => {
  test("is a function", () => {
    expect(typeof handleCopyUrl).toBe("function")
  })
})
