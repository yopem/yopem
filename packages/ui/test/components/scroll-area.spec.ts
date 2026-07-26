import { describe, expect, test } from "vite-plus/test"

import { ScrollArea, ScrollBar } from "ui/components/scroll-area"

describe("scroll-area", () => {
  test("ScrollArea is exported", () => {
    expect(ScrollArea).toBeDefined()
  })

  test("ScrollBar is exported", () => {
    expect(ScrollBar).toBeDefined()
  })
})
