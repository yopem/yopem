import { describe, expect, test } from "vite-plus/test"

import { findModelProvider, providerNames } from "@/lib/utils/provider"

describe("provider utilities", () => {
  test("are defined", () => {
    expect(findModelProvider).toBeDefined()
    expect(providerNames).toBeDefined()
  })
})
