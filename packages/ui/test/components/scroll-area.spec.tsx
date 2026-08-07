import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/scroll-area"

describe("ui/components/scroll-area", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ScrollArea).toBeDefined()
    expect(mod.ScrollBar).toBeDefined()
    expect(mod.ScrollAreaPrimitive).toBeDefined()
  })
})
