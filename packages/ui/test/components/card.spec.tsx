import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/card"

describe("ui/components/card", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Card).toBeDefined()
    expect(mod.CardFrame).toBeDefined()
    expect(mod.CardFrameHeader).toBeDefined()
    expect(mod.CardFrameTitle).toBeDefined()
    expect(mod.CardFrameDescription).toBeDefined()
  })
})
