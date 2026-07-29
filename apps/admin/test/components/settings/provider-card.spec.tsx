import { describe, expect, test } from "vite-plus/test"

import { ProviderCard } from "@/components/settings/provider-card"

describe("ProviderCard", () => {
  test("is a React component (memo-wrapped)", () => {
    expect(ProviderCard).toBeDefined()
    expect(
      typeof ProviderCard === "function" || typeof ProviderCard === "object",
    ).toBe(true)
  })
})
