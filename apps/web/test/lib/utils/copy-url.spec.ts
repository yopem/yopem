import { describe, expect, test } from "vite-plus/test"

import { handleCopyUrl } from "@/lib/utils/copy-url"

describe("handleCopyUrl utility", () => {
  test("is defined", () => {
    expect(handleCopyUrl).toBeDefined()
  })
})
