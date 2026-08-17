// @vitest-environment jsdom

import { describe, expect, test, vi } from "vite-plus/test"

import { handleCopyUrl } from "@/lib/utils/copy-url"

describe("handleCopyUrl", () => {
  test("writes URL to clipboard and triggers success toast", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      writable: true,
      value: { writeText: writeTextMock },
    })

    await handleCopyUrl("https://example.com/item/1")

    expect(writeTextMock).toHaveBeenCalledWith("https://example.com/item/1")
  })
})
