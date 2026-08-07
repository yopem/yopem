import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/skeleton"

describe("ui/components/skeleton", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Skeleton).toBeDefined()
  })
})
