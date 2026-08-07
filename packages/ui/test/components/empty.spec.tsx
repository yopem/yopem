import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/empty"

describe("ui/components/empty", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Empty).toBeDefined()
    expect(mod.EmptyHeader).toBeDefined()
    expect(mod.EmptyMedia).toBeDefined()
    expect(mod.EmptyTitle).toBeDefined()
    expect(mod.EmptyDescription).toBeDefined()
  })
})
